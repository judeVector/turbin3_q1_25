'use client'

import { getPaystreamProgram, getPaystreamProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function usePaystreamProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getPaystreamProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getPaystreamProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['paystream', 'all', { cluster }],
    queryFn: () => program.account.paystream.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['paystream', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ paystream: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function usePaystreamProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = usePaystreamProgram()

  const accountQuery = useQuery({
    queryKey: ['paystream', 'fetch', { cluster, account }],
    queryFn: () => program.account.paystream.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['paystream', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ paystream: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['paystream', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ paystream: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['paystream', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ paystream: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['paystream', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ paystream: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
