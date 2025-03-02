// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import PaystreamIDL from '../target/idl/paystream.json'
import type { Paystream } from '../target/types/paystream'

// Re-export the generated IDL and type
export { Paystream, PaystreamIDL }

// The programId is imported from the program IDL.
export const PAYSTREAM_PROGRAM_ID = new PublicKey(PaystreamIDL.address)

// This is a helper function to get the Paystream Anchor program.
export function getPaystreamProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...PaystreamIDL, address: address ? address.toBase58() : PaystreamIDL.address } as Paystream, provider)
}

// This is a helper function to get the program ID for the Paystream program depending on the cluster.
export function getPaystreamProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Paystream program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return PAYSTREAM_PROGRAM_ID
  }
}
