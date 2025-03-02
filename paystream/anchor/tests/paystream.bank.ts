// import { describe, it, before } from "node:test";
// import { BN, Program } from "@coral-xyz/anchor";
// import { BankrunProvider } from "anchor-bankrun";
// import { assert, expect } from "chai";

// import {
//   TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddressSync,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   getAccount,
// } from "@solana/spl-token";
// import { createAccount, createMint, mintTo } from "spl-token-bankrun";
// import { startAnchor, BanksClient, ProgramTestContext, Clock } from "solana-bankrun";
// import { PublicKey, Keypair } from "@solana/web3.js";
// const IDL = require("../target/idl/paystream.json");
// import { Paystream } from "../target/types/paystream";

// describe("Paystream Smart Contract Tests", () => {
//   let context: ProgramTestContext;
//   let banksClient: BanksClient;
//   let payer: Keypair;
//   let provider: BankrunProvider;
//   let program: Program<Paystream>;
//   let workflowPDA: PublicKey;
//   let paystreamVault: PublicKey;
//   let payerATA: PublicKey;
//   let receiverATA: PublicKey;
//   let usdcMint: PublicKey;

//   const workflowId = "test_workflow";
//   const interval = 1;
//   const approvalsRequired = 2;
//   const approver1 = Keypair.generate();
//   const approver2 = Keypair.generate();
//   const receiver = Keypair.generate();
//   const unauthorizedApprover = Keypair.generate();
//   const TOKEN_AMOUNT = 5_000_000;

//   before(async () => {
//     context = await startAnchor(
//       "",
//       [{ name: "paystream", programId: new PublicKey(IDL.address) }],
//       []
//     );
//     provider = new BankrunProvider(context);
//     banksClient = context.banksClient;
//     payer = provider.wallet.payer;
//     program = new Program<Paystream>(IDL as Paystream, provider);

//     // Create USDC mint (6 decimals)
//     usdcMint = await createMint(banksClient, payer, payer.publicKey, null, 6);

//     // Create ATAs for payer and receiver
//     payerATA = getAssociatedTokenAddressSync(
//       usdcMint,
//       payer.publicKey,
//       false,
//       TOKEN_PROGRAM_ID,
//       ASSOCIATED_TOKEN_PROGRAM_ID
//     );
//     receiverATA = getAssociatedTokenAddressSync(
//       usdcMint,
//       receiver.publicKey,
//       false,
//       TOKEN_PROGRAM_ID,
//       ASSOCIATED_TOKEN_PROGRAM_ID
//     );

//     // Ensure receiver's ATA exists before transactions
//     await createAccount(banksClient, payer, usdcMint, receiver.publicKey);

//     // Create and fund payer's token account
//     await createAccount(banksClient, payer, usdcMint, payer.publicKey);
//     await mintTo(banksClient, payer, usdcMint, payerATA, payer, 7_000_000);

//     console.log(
//       "Payer Initial Balance:",
//       await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//     );

//     // Derive workflow PDA
//     workflowPDA = PublicKey.findProgramAddressSync(
//       [Buffer.from("workflow"), payer.publicKey.toBuffer(), Buffer.from(workflowId)],
//       program.programId
//     )[0];
//     console.log("Workflow PDA derived:", workflowPDA.toBase58());

//     // Derive paystream vault
//     paystreamVault = getAssociatedTokenAddressSync(
//       usdcMint,
//       workflowPDA,
//       true,
//       TOKEN_PROGRAM_ID,
//       ASSOCIATED_TOKEN_PROGRAM_ID
//     );

//     console.log("Paystream Vault Address:", paystreamVault.toBase58());
//   });

//   it("should initialize a new payment workflow", async () => {
//     try {
//       const initializeWorkflowTx = await program.methods
//         .initializeWorkflow(workflowId, new BN(TOKEN_AMOUNT), new BN(interval), approvalsRequired, [
//           approver1.publicKey,
//           approver2.publicKey,
//         ])
//         .accounts({
//           payer: payer.publicKey,
//           usdcMint: usdcMint,
//           tokenProgram: TOKEN_PROGRAM_ID,
//         })
//         .signers([payer])
//         .rpc();

//       console.log("Initialized a new payment workflow:", initializeWorkflowTx);

//       const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);
//       console.log("Workflow account:", workflowAccount);
//       console.log(
//         "Paystream vault balance:",
//         await getAccount(provider.connection, paystreamVault).then((acc) => Number(acc.amount))
//       );
//       console.log(
//         "Payer balance After transfer:",
//         await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//       );
//     } catch (error) {
//       console.error("Error in test:", error);
//       throw error;
//     }
//   });

//   it("should process approvals from authorized approvers", async () => {
//     await program.methods
//       .approveWorkflow()
//       .accounts({
//         approver: approver1.publicKey,
//         workflow: workflowPDA,
//       })
//       .signers([approver1])
//       .rpc();

//     await program.methods
//       .approveWorkflow()
//       .accounts({
//         approver: approver2.publicKey,
//         workflow: workflowPDA,
//       })
//       .signers([approver2])
//       .rpc();

//     const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);
//     expect(workflowAccount.approvalsReceived).to.equal(2);
//   });

//   it("should reject approval from an unauthorized approver", async () => {
//     let errorThrown = false;

//     try {
//       await program.methods
//         .approveWorkflow()
//         .accounts({
//           approver: unauthorizedApprover.publicKey,
//           workflow: workflowPDA,
//         })
//         .signers([unauthorizedApprover])
//         .rpc();
//     } catch (error) {
//       errorThrown = true;
//       assert.include(error.toString(), "Unauthorized action", "Wrong error message received");
//     }

//     assert.isTrue(errorThrown, "Expected an error but none was thrown");
//   });

//   it("should cancel an active workflow", async () => {
//     const cancelWorkflowId = "cancel_workflow";
//     const [cancelWorkflowPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("workflow"), payer.publicKey.toBuffer(), Buffer.from(cancelWorkflowId)],
//       program.programId
//     );

//     console.log(
//       "Payer balance BEFORE cancel transfer:",
//       await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//     );

//     // Derive cancelPaystream vault
//     const cancelPaystreamVault = getAssociatedTokenAddressSync(
//       usdcMint,
//       cancelWorkflowPDA,
//       true,
//       TOKEN_PROGRAM_ID,
//       ASSOCIATED_TOKEN_PROGRAM_ID
//     );

//     await program.methods
//       .initializeWorkflow(cancelWorkflowId, new BN(2_000_000), new BN(5), 2, [
//         Keypair.generate().publicKey,
//       ])
//       .accounts({
//         payer: payer.publicKey,
//         usdcMint,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     const workflowAccount = await program.account.paymentWorkflow.fetch(cancelWorkflowPDA);

//     console.log("Workflow account:", workflowAccount);

//     console.log(
//       "Cancel Paystream vault balance:",
//       await getAccount(provider.connection, cancelPaystreamVault).then((acc) => Number(acc.amount))
//     );
//     console.log(
//       "Payer balance After transfer:",
//       await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//     );

//     const Ix = await program.methods
//       .cancelWorkflow()
//       .accounts({
//         creator: payer.publicKey,
//         usdcMint: usdcMint,
//         // @ts-ignore
//         workflow: cancelWorkflowPDA,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();

//     console.log(
//       "Payer balance After Cancellation:",
//       await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//     );

//     expect(Ix).to.be.ok;
//   });

//   it("should execute the payment when due", async () => {
//     console.log(
//       "Payer Balance BEFORE payment execution:",
//       await getAccount(provider.connection, payerATA).then((acc) => Number(acc.amount))
//     );
//     console.log(
//       "Receiver Balance BEFORE payment execution:",
//       await getAccount(provider.connection, receiverATA).then((acc) => Number(acc.amount))
//     );

//     // Fetch the current workflow state
//     const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);

//     // Fetch the current blockchain clock
//     const currentClock = await context.banksClient.getClock();

//     // Advance time to be after the next payment due time
//     const newClock = new Clock(
//       currentClock.slot,
//       currentClock.epochStartTimestamp,
//       currentClock.epoch,
//       currentClock.leaderScheduleEpoch,
//       BigInt(workflowAccount.nextPayment.toNumber() + 1) // Ensure payment is due
//     );

//     // Apply the new time to the blockchain
//     await context.setClock(newClock);

//     // Execute the payment
//     const tx = await program.methods
//       .executePayment()
//       .accounts({
//         creator: payer.publicKey,
//         usdcMint: usdcMint,
//         // @ts-ignore
//         workflow: workflowPDA,
//         receiver: receiver.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .signers([payer])
//       .rpc();

//     console.log("Payment executed successfully:", tx);

//     // Fetch receiver's balance after payment
//     const receiverBalance = await getAccount(provider.connection, receiverATA).then((acc) =>
//       Number(acc.amount)
//     );
//     const payerBalance = await getAccount(provider.connection, payerATA).then((acc) =>
//       Number(acc.amount)
//     );
//     console.log("Receiver Balance AFTER payment execution:", receiverBalance);
//     console.log("payer Balance AFTER payment execution:", payerBalance);

//     // Validate expected balance change
//     expect(receiverBalance).to.be.greaterThan(0);
//   });
// });

import { BN, Program, AnchorProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";

const IDL = require("../target/idl/paystream.json");
import { Paystream } from "../target/types/paystream";

describe("Paystream Smart Contract Tests", () => {
  let connection: Connection;
  let provider: AnchorProvider;
  let program: Program<Paystream>;
  let payer: Keypair;
  let workflowPDA: PublicKey;
  let paystreamVault: PublicKey;
  let payerATA: PublicKey;
  let receiverATA: PublicKey;
  let usdcMint: PublicKey;

  const workflowId = "test_workflow";
  const interval = 1;
  const approvalsRequired = 2;
  const approver1 = Keypair.generate();
  const approver2 = Keypair.generate();
  const receiver = Keypair.generate();
  const unauthorizedApprover = Keypair.generate();
  const TOKEN_AMOUNT = 5_000_000;

  // Setup before all tests
  beforeAll(async () => {
    // Set up connection to the local validator
    connection = new Connection("http://127.0.0.1:8899", "confirmed");

    payer = Keypair.generate();
    await connection.requestAirdrop(payer.publicKey, 1_000_000_000);
    // Wait for airdrop confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Set up the Anchor provider
    provider = new AnchorProvider(connection, new anchor.Wallet(payer), {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // Load the deployed program
    program = new Program<Paystream>(IDL, provider);

    // Create USDC mint (6 decimals)
    usdcMint = await createMint(connection, payer, payer.publicKey, null, 6, undefined, {
      commitment: "confirmed",
    });

    // Create associated token accounts (ATAs)
    payerATA = await createAssociatedTokenAccount(connection, payer, usdcMint, payer.publicKey, {
      commitment: "confirmed",
    });
    receiverATA = await createAssociatedTokenAccount(
      connection,
      payer,
      usdcMint,
      receiver.publicKey,
      { commitment: "confirmed" }
    );

    // Mint tokens to payer's ATA
    await mintTo(connection, payer, usdcMint, payerATA, payer, 7_000_000, [], {
      commitment: "confirmed",
    });

    console.log(
      "Payer Initial Balance:",
      await getAccount(connection, payerATA).then((acc) => Number(acc.amount))
    );

    // Derive workflow PDA
    workflowPDA = PublicKey.findProgramAddressSync(
      [Buffer.from("workflow"), payer.publicKey.toBuffer(), Buffer.from(workflowId)],
      program.programId
    )[0];
    console.log("Workflow PDA derived:", workflowPDA.toBase58());

    // Derive paystream vault
    paystreamVault = getAssociatedTokenAddressSync(
      usdcMint,
      workflowPDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("Paystream Vault Address:", paystreamVault.toBase58());
  });

  it("should initialize a new payment workflow", async () => {
    const initializeWorkflowTx = await program.methods
      .initializeWorkflow(workflowId, new BN(TOKEN_AMOUNT), new BN(interval), approvalsRequired, [
        approver1.publicKey,
        approver2.publicKey,
      ])
      .accounts({
        payer: payer.publicKey,
        usdcMint: usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Initialized a new payment workflow:", initializeWorkflowTx);

    const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);
    console.log("Workflow account:", workflowAccount);
    console.log(
      "Paystream vault balance:",
      await getAccount(connection, paystreamVault).then((acc) => Number(acc.amount))
    );
    console.log(
      "Payer balance After transfer:",
      await getAccount(connection, payerATA).then((acc) => Number(acc.amount))
    );

    // No explicit assertion needed unless you want to validate specific fields
    expect(initializeWorkflowTx).toBeDefined(); // Basic check that the transaction succeeded
  });

  it("should process approvals from authorized approvers", async () => {
    await program.methods
      .approveWorkflow()
      .accounts({
        approver: approver1.publicKey,
        workflow: workflowPDA,
      })
      .signers([approver1])
      .rpc();

    await program.methods
      .approveWorkflow()
      .accounts({
        approver: approver2.publicKey,
        workflow: workflowPDA,
      })
      .signers([approver2])
      .rpc();

    const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);
    expect(workflowAccount.approvalsReceived).toBe(2); // Jest's expect replacing Chai's expect.equal
  });

  it("should reject approval from an unauthorized approver", async () => {
    await expect(
      program.methods
        .approveWorkflow()
        .accounts({
          approver: unauthorizedApprover.publicKey,
          workflow: workflowPDA,
        })
        .signers([unauthorizedApprover])
        .rpc()
    ).rejects.toThrow(/Unauthorized action/); // Jest's expect(...).rejects.toThrow replaces try-catch with Chai assert
  });

  it("should cancel an active workflow", async () => {
    const cancelWorkflowId = "cancel_workflow";
    const [cancelWorkflowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("workflow"), payer.publicKey.toBuffer(), Buffer.from(cancelWorkflowId)],
      program.programId
    );

    console.log(
      "Payer Balance BEFORE cancel transfer:",
      await getAccount(connection, payerATA).then((acc) => Number(acc.amount))
    );

    const cancelPaystreamVault = getAssociatedTokenAddressSync(
      usdcMint,
      cancelWorkflowPDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await program.methods
      .initializeWorkflow(cancelWorkflowId, new BN(2_000_000), new BN(5), 2, [
        Keypair.generate().publicKey,
      ])
      .accounts({
        payer: payer.publicKey,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const workflowAccount = await program.account.paymentWorkflow.fetch(cancelWorkflowPDA);
    console.log("Workflow account:", workflowAccount);

    console.log(
      "Cancel Paystream vault balance:",
      await getAccount(connection, cancelPaystreamVault).then((acc) => Number(acc.amount))
    );
    console.log(
      "Payer balance After transfer:",
      await getAccount(connection, payerATA).then((acc) => Number(acc.amount))
    );

    const tx = await program.methods
      .cancelWorkflow()
      .accounts({
        creator: payer.publicKey,
        usdcMint: usdcMint,
        // @ts-ignore
        workflow: cancelWorkflowPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    expect(tx).toBeDefined(); // Replaces Chai's expect(tx).to.be.ok
  });

  it("should execute the payment when due", async () => {
    console.log(
      "Payer Balance BEFORE payment execution:",
      await getAccount(connection, payerATA).then((acc) => Number(acc.amount))
    );
    console.log(
      "Receiver Balance BEFORE payment execution:",
      await getAccount(connection, receiverATA).then((acc) => Number(acc.amount))
    );

    const workflowAccount = await program.account.paymentWorkflow.fetch(workflowPDA);
    console.log("Workflow account:", workflowAccount);

    // Wait for payment to be due (assuming interval is 1 second)
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    const tx = await program.methods
      .executePayment()
      .accounts({
        creator: payer.publicKey,
        usdcMint: usdcMint,
        // @ts-ignore
        workflow: workflowPDA,
        receiver: receiver.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Payment executed successfully:", tx);

    const receiverBalance = await getAccount(connection, receiverATA).then((acc) =>
      Number(acc.amount)
    );
    const payerBalance = await getAccount(connection, payerATA).then((acc) => Number(acc.amount));
    console.log("Receiver Balance AFTER payment execution:", receiverBalance);
    console.log("Payer Balance AFTER payment execution:", payerBalance);

    expect(receiverBalance).toBeGreaterThan(0); // Replaces Chai's expect(...).to.be.greaterThan
  });
});
