use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{error::PaystreamError, PaymentWorkflow};

/// Accounts structure for executing a payment.
#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: The receiver is only used as a destination for closing the vault.
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = usdc_mint,
        associated_token::authority = receiver
    )]
    pub receiver_associated_token_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = receiver,
        seeds = [b"workflow", creator.key.as_ref(), workflow.workflow_id.as_bytes().as_ref()],
        bump = workflow.bump,
    )]
    pub workflow: Account<'info, PaymentWorkflow>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = workflow,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

/// Module for executing the payment once all conditions are met.

pub fn handler_execute_payment(ctx: Context<ExecutePayment>) -> Result<()> {
    let workflow = &mut ctx.accounts.workflow;
    let current_time = Clock::get()?.unix_timestamp;

    // Ensure the workflow is active and that the scheduled time and approval count have been met
    require!(workflow.active, PaystreamError::WorkflowInactive);
    require!(
        current_time >= workflow.next_payment,
        PaystreamError::PaymentNotDue
    );
    require!(
        workflow.approvals_received >= workflow.approvals_required,
        PaystreamError::InsufficientApprovals
    );

    // Prepare seeds for signing with the workflow PDA
    let seeds = &[
        b"workflow".as_ref(),
        ctx.accounts.creator.key.as_ref(),
        workflow.workflow_id.as_bytes(),
        &[workflow.bump],
    ];
    let signer = &[&seeds[..]];

    // Transfer the tokens from the vault to the receiver's associated token account
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.receiver_associated_token_a.to_account_info(),
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
        ctx.accounts.vault.amount,
        ctx.accounts.usdc_mint.decimals,
    )?;

    // Close the vault account (any remaining lamports go to the receiver)
    let cpi_close_accounts = CloseAccount {
        account: ctx.accounts.vault.to_account_info(),
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
