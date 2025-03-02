use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{error::PaystreamError, PaymentWorkflow, ANCHOR_DISCRIMINATOR_SIZE, USDC_MINT_ADDRESS};

use super::transfer_tokens;

#[derive(Accounts)]
#[instruction(workflow_id: String)]
pub struct InitializeWorkflow<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program
    )]
    pub payer_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR_SIZE + PaymentWorkflow::INIT_SPACE,
        seeds = [b"workflow", payer.key().as_ref(), workflow_id.as_bytes().as_ref()],
        bump
    )]
    pub workflow: Account<'info, PaymentWorkflow>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = usdc_mint,
        associated_token::authority = workflow,
        associated_token::token_program = token_program
    )]
    pub paystream_vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Module for initializing a new payment workflow.
pub fn handler_initialize_workflow(
    ctx: Context<InitializeWorkflow>,
    workflow_id: String,
    amount_in_usdc: u64,
    interval: i64,
    approvals_required: u8,
    authorized_approvers: Vec<Pubkey>,
) -> Result<()> {
    // Input validations
    require!(amount_in_usdc > 0, PaystreamError::InvalidAmount);
    require!(
        approvals_required > 0,
        PaystreamError::InvalidApprovalsRequired
    );
    require!(interval > 0, PaystreamError::InvalidInterval);
    require!(workflow_id.len() <= 32, PaystreamError::WorkflowIdTooLong);

    #[cfg(not(feature = "skip-usdc-mint-check"))]
    require!(
        ctx.accounts.usdc_mint.key() == USDC_MINT_ADDRESS,
        PaystreamError::InvalidUsdcMint
    );

    // Transfer USDC from payer to the paystream vault
    transfer_tokens(
        &ctx.accounts.payer_token_account,
        &ctx.accounts.paystream_vault,
        &amount_in_usdc,
        &ctx.accounts.usdc_mint,
        &ctx.accounts.payer,
        &ctx.accounts.token_program,
    )?;

    // Limit the authorized approvers to 5
    let num_approvers = authorized_approvers.len().min(5);
    let mut auth_approvers = [Pubkey::default(); 5];
    for (i, approver) in authorized_approvers.iter().take(num_approvers).enumerate() {
        auth_approvers[i] = *approver;
    }

    // Save the workflow data
    ctx.accounts.workflow.set_inner(PaymentWorkflow {
        workflow_id,
        creator: ctx.accounts.payer.key(),
        usdc_mint: ctx.accounts.usdc_mint.key(),
        amount: amount_in_usdc,
        bump: ctx.bumps.workflow,
        interval,
        next_payment: Clock::get()?.unix_timestamp + interval,
        approvals_required,
        approvals_received: 0,
        active: true,
        authorized_approvers: auth_approvers,
        approvals: [Pubkey::default(); 5],
        approver_count: num_approvers as u8,
    });

    Ok(())
}
