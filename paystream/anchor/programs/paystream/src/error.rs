use anchor_lang::prelude::*;

/// Custom errors for the paystream program.
#[error_code]
pub enum PaystreamError {
    #[msg("Invalid USDC amount.")]
    InvalidAmount,
    #[msg("Invalid approvals required.")]
    InvalidApprovalsRequired,
    #[msg("Invalid interval.")]
    InvalidInterval,
    #[msg("Workflow ID is too long.")]
    WorkflowIdTooLong,
    #[msg("Invalid USDC Mint address.")]
    InvalidUsdcMint,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Workflow is not active.")]
    WorkflowInactive,
    #[msg("Approver has already approved.")]
    AlreadyApproved,
    #[msg("Approval count overflow.")]
    ApprovalOverflow,
    #[msg("Payment is not due yet.")]
    PaymentNotDue,
    #[msg("Insufficient approvals to execute payment.")]
    InsufficientApprovals,
}

// #[error_code]
// pub enum PaystreamError {
//     #[msg("Amount must be greater than 0")]
//     InvalidAmount,

//     #[msg("Payment interval must be greater than 0")]
//     InvalidInterval,

//     #[msg("Workflow ID cannot be longer than 32 characters")]
//     WorkflowIdTooLong,

//     #[msg("Invalid USDC mint address")]
//     InvalidUsdcMint,

//     #[msg("Insufficient funds in payer wallet")]
//     InsufficientFunds,

//     #[msg("Workflow is not active")]
//     WorkflowNotActive,

//     #[msg("Maximum number of approvals already received")]
//     MaxApprovalsReached,

//     #[msg("Next payment time has not been reached")]
//     PaymentTimeNotReached,

//     #[msg("Required number of approvals not met")]
//     InsufficientApprovals,

//     #[msg("Payment is not due yet")]
//     PaymentNotDue,

//     #[msg("Workflow is inactive")]
//     WorkflowInactive,

//     #[msg("Invalid approvals required")]
//     InvalidApprovalsRequired,

//     #[msg("Approver has already approved this workflow")]
//     AlreadyApproved,

//     #[msg("Unauthorized access")]
//     Unauthorized,
// }
