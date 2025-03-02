pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("DAYjs6DLbqeUgX6V1bjf6w1huuit6bQ9PiwXXXxMLV9h");

#[program]
pub mod paystream {
    use super::*;
    pub fn initialize_workflow(
        ctx: Context<InitializeWorkflow>,
        workflow_id: String,
        amount_in_usdc: u64,
        interval: i64,
        approvals_required: u8,
        authorized_approvers: Vec<Pubkey>,
    ) -> Result<()> {
        initialize_workflow::handler_initialize_workflow(
            ctx,
            workflow_id,
            amount_in_usdc,
            interval,
            approvals_required,
            authorized_approvers,
        )
    }

    pub fn approve_workflow(ctx: Context<ApproveWorkflow>) -> Result<()> {
        approve_workflow::handler_approve_workflow(ctx)
    }

    pub fn execute_payment(ctx: Context<ExecutePayment>) -> Result<()> {
        execute_payment::handler_execute_payment(ctx)
    }

    pub fn cancel_workflow(ctx: Context<CancelWorkflow>) -> Result<()> {
        cancel_workflow::handler_cancel_workflow(ctx)
    }
}
