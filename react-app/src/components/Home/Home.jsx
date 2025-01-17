import { useChain } from '@cosmos-kit/react';
import { useState, useMemo } from "react";
import { chains } from 'chain-registry';
import { useInitializeClient } from '../../hooks/useInitializeClient';
import { useFetchBalance } from '../../hooks/useFetchBalance';
import { useDebounce } from '../../hooks/useDebounce';
import { useFetchRpcEndpoint } from '../../hooks/useFetchRpcEndpint';
import TransactionsList from '../TransactionsList/TransactionsList';
import { useFetchBlockData } from '../../hooks/useFetchBlockData';
import ChainSelect from '../ChainSelect/ChainSelect';
import PoolsTable from '../PoolsTable/PoolsTable';
import { AppConstants } from '../../AppConstants';
import { useFetchPools } from '../../hooks/useFetchPools';
import '../../App.css';

const Home = () => {
    const [selectedChain, setSelectedChain] = useState(AppConstants.ChainIds.CELESTIA);
    const chainData = useMemo(() => {
        return chains?.find((c) => c.chain_id === selectedChain);
    }, [selectedChain]);
    const { connect, openView, isWalletConnected, getRpcEndpoint, address, disconnect, chain } = useChain(chainData?.chain_name || '');
    const [rpc, setRpc] = useFetchRpcEndpoint(getRpcEndpoint, selectedChain, isWalletConnected);

    const [client, setClient] = useInitializeClient(rpc, isWalletConnected);
    const [blockId, setBlockId] = useState('');
    const debouncedInput = useDebounce(blockId, 500);
    const [hashes, setHashes, isFetchingHashes] = useFetchBlockData(client, rpc, debouncedInput);
    const denom = useMemo(() => {
        return chain?.staking?.staking_tokens[0]?.denom;
    }, [chain]);
    const url = useMemo(() => {
        return chainData?.explorers.find(explorer => explorer?.kind?.toLowerCase() === AppConstants.EXPLORERS.MINTSKAN)?.url
    }, [chainData]);
    const [balance, setBalance, isFetchingBalance] = useFetchBalance(client, address, denom);
    const [pools, isFetchingPools, fetchPools] = useFetchPools(rpc);
    const handleFetchPools = () => {
        fetchPools();
    }
    const handleChange = (event) => {
        const newChain = event.target.value;
        setSelectedChain(newChain);
        setBalance(null);
        setRpc('')
        setClient(null);
        setHashes([]);
        setBlockId('');
        disconnect();
    };

    return (
        <div className="container">
            <ChainSelect selectedChain={selectedChain} handleChange={handleChange} />
            <button
                className="connectWallet"
                onClick={() => (isWalletConnected ? openView() : connect())}
            >
                {isWalletConnected ? "Open Wallet" : "Connect Wallet"}
            </button>
            {isWalletConnected && (
                <div className="blockData">
                    {isFetchingBalance || !balance ? (
                        <p>Fetching balance...</p>
                    ) : (
                        <p>Balance: {balance?.amount} {denom}</p>
                    )}
                    <input
                        type="text"
                        value={blockId}
                        onChange={(e) => setBlockId(e.target.value)}
                        placeholder="Enter block ID"
                    />
                    <TransactionsList hashes={hashes} isFetchingHashes={isFetchingHashes} url={url} />
                    {chainData?.chain_id === AppConstants.ChainIds.MANTRA && (
                        <div className='blockData'>
                            <button
                                className="connectWallet"
                                onClick={handleFetchPools}
                            >
                                Get Pools
                            </button>
                            {(pools || isFetchingPools) && <PoolsTable pools={pools} isFetchingPools={isFetchingPools} />}
                        </div>)}

                </div>
            )}
        </div>
    );
};

export default Home;