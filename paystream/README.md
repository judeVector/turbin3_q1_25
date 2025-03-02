# PayStream

A Solana smart contract for automated, secure payment workflows with multi-signature approval requirements.

## Overview

PayStream is a decentralized application built on the Solana blockchain that enables automated, recurring payments with configurable approval workflows. It allows users to create payment streams that require multiple approvals before executing, providing an additional layer of security and governance for financial transactions.

## Features

- **Secure Payment Workflows**: Create payment streams with funds held in escrow until all conditions are met
- **Multi-signature Approval**: Configure multiple approvers required for payment execution
- **Recurring Payments**: Set intervals for automated, recurring payments
- **Cancellation Option**: Cancel workflows and return funds to the creator at any time
- **SPL Token Integration**: Compatible with SPL tokens (e.g., USDC) for diverse payment options

## Smart Contract Architecture

The PayStream smart contract consists of the following main components:

1. **Payment Workflow Initialization**: Creates a new workflow with specified parameters
2. **Approval Handling**: Manages approvals from authorized approvers
3. **Payment Execution**: Processes payments when due and approved
4. **Workflow Cancellation**: Allows creators to cancel workflows and recover funds

## Technical Implementation

The contract is built using Anchor framework, which simplifies Solana program development. Key technical aspects include:

- Program Derived Addresses (PDAs) for secure fund management
- Associated Token Accounts for SPL token operations
- Proper authorization checks for all sensitive operations
- Time-based payment execution logic

## Installation and Usage

### Prerequisites

- Solana CLI tools
- Node.js and npm/yarn
- Anchor framework

### Building the Project

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Deploy to your preferred Solana cluster
anchor deploy
```

### Testing

The project includes comprehensive tests that demonstrate the functionality:

```bash
# Start a local Solana validator
solana-test-validator

# Run the test suite
anchor test
```

## API Reference

### Main Instructions

#### Initialize Workflow

Creates a new payment workflow with the specified parameters:

- `workflowId`: Unique identifier for the workflow
- `tokenAmount`: Amount to transfer per interval
- `interval`: Time between payments (in seconds/blocks)
- `approvalsRequired`: Number of approvals needed to execute payments
- `approvers`: Array of public keys authorized to approve

#### Approve Workflow

Records an approval from an authorized approver.

#### Execute Payment

Executes the payment when due and sufficiently approved.

#### Cancel Workflow

Cancels an active workflow and returns funds to the creator.

## Security Considerations

- All funds are held in program-derived address (PDA) escrow accounts
- Proper access control checks for all sensitive operations
- Thorough input validation to prevent exploitation

## Future Enhancements

- Support for multiple token types in a single workflow
- Variable payment amounts based on predefined conditions
- Integration with off-chain data sources via oracles
- Expanded approval rules (e.g., approval expiration, minimum threshold)
- User interface for easy interaction with the contract

## Acknowledgments

- Solana Foundation
- Turbin3
- Anchor Framework
