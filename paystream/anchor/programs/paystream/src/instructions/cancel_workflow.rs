use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{error::PaystreamError, PaymentWorkflow};

/// Accounts structure for cancelling a workflow
#[derive(Accounts)]
pub struct CancelWorkflow<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = creator,
        seeds = [b"workflow", creator.key.as_ref(), workflow.workflow_id.as_bytes().as_ref()],
        bump = workflow.bump,
    )]
    pub workflow: Account<'info, PaymentWorkflow>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = workflow,
    )]
    pub paystream_vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

/// Module for cancelling a workflow.
pub fn handler_cancel_workflow(ctx: Context<CancelWorkflow>) -> Result<()> {
    let workflow = &mut ctx.accounts.workflow;
    // Only the workflow creator can cancel it.
    require!(
        workflow.creator == ctx.accounts.creator.key(),
        PaystreamError::Unauthorized
    );
    let seeds = &[
        b"workflow".as_ref(),
        ctx.accounts.creator.key.as_ref(),
        workflow.workflow_id.as_bytes(),
        &[workflow.bump],
    ];
    let signer = &[&seeds[..]];

    // Transfer the tokens from the vault to the creator's associated token account
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.paystream_vault.to_account_info(),
        to: ctx.accounts.creator_token_account.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
        authority: workflow.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );

    transfer_checked(
        cpi_ctx,
        ctx.accounts.paystream_vault.amount,
        ctx.accounts.usdc_mint.decimals,
    )?;

    // Close the vault account (any remaining lamports go to the receiver)
    let cpi_close_accounts = CloseAccount {
        account: ctx.accounts.paystream_vault.to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: workflow.to_account_info(),
    };
    let cpi_close_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_close_accounts,
        signer,
    );
    close_account(cpi_close_ctx)?;

    // Mark the workflow as inactive to prevent reuse
    workflow.active = false;
    Ok(())
}
