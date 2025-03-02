use anchor_lang::prelude::*;

use crate::{error::PaystreamError, PaymentWorkflow};

/// Accounts structure for approving a workflow.
#[derive(Accounts)]
pub struct ApproveWorkflow<'info> {
    #[account(mut)]
    pub approver: Signer<'info>,

    #[account(mut)]
    pub workflow: Account<'info, PaymentWorkflow>,
}

// Approve a payment workflow
/// Adds an approval from an authorized approver.
/// Each approver can only approve once.

pub fn handler_approve_workflow(ctx: Context<ApproveWorkflow>) -> Result<()> {
    let workflow = &mut ctx.accounts.workflow;
    let approver_key = ctx.accounts.approver.key();
    let approvals_received = workflow.approvals_received;

    // Check that the workflow is active
    require!(workflow.active, PaystreamError::WorkflowInactive);

    // Verify the signer is an authorized approver
    let is_authorized =
        workflow.authorized_approvers[..workflow.approver_count as usize].contains(&approver_key);
    require!(is_authorized, PaystreamError::Unauthorized);

    // Ensure the approver hasn't already approved
    require!(
        !workflow.approvals[..workflow.approvals_received as usize].contains(&approver_key),
        PaystreamError::AlreadyApproved
    );

    // Add the approval and increment the counter
    require!(
        (workflow.approvals_received as usize) < workflow.authorized_approvers.len(),
        PaystreamError::ApprovalOverflow
    );
    workflow.approvals[approvals_received as usize] = approver_key;
    workflow.approvals_received = workflow.approvals_received.checked_add(1).unwrap();

    Ok(())
}
