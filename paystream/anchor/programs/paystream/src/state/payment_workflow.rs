use anchor_lang::prelude::*;

/// The data stored for each payment workflow.
#[account]
#[derive(InitSpace)]
pub struct PaymentWorkflow {
    #[max_len(32)]
    pub workflow_id: String, // limited to 32 bytes maximum
    pub creator: Pubkey,                   // creator of the workflow
    pub usdc_mint: Pubkey,                 // USDC mint address
    pub amount: u64,                       // amount of USDC to transfer
    pub bump: u8,                          // bump seed for PDA
    pub interval: i64,                     // time interval (in seconds) until payment is due
    pub next_payment: i64,                 // Unix timestamp when payment is scheduled
    pub approvals_required: u8,            // number of approvals required to execute payment
    pub approvals_received: u8,            // current number of approvals received
    pub active: bool,                      // indicates if the workflow is active
    pub authorized_approvers: [Pubkey; 5], // list of authorized approvers (up to 5)
    pub approvals: [Pubkey; 5],            // list of approvers who have approved
    pub approver_count: u8,                // actual number of authorized approvers
}
