# v4-migration-lib

V4 Migration Library

## Testing:

This PR requires both the V3 and V4 contracts so it's currently a two-step process to test it.

### Test with V3 contracts

This part covers testing the functions which request the asset URL from the provider and decrypt it. This requires signing a transaction to verify that the user is the publisher.

- run the V3 contracts with barge:

```
cd barge
./start_ocean.sh --with-provider2 --no-dashboard
```

- Now, in a different terminal set the location of the smart contracts as an env:

```
export ADDRESS_FILE="${HOME}/.ocean/ocean-contracts/artifacts/address.json"
```

- Next run the tests for requesting the dataset URL from the V3 provider:

```
npm run test:url
```

## Test with V4 contracts

This part covers testing converting the V3 DDO to a V4 DDO, publishing the NFT and ERC20 with fixed pricing, and updating the DDO with the NFT token address & ERC20 address.

- Close the terminal which has been running the V3 contracts.
- Open the contracts repository and checkout the v4main branch

```
cd contracts
git checkout v4main
```

- Run the V4 contracts:

```
npx hardhat node
```

- Now, in a terminal in the v4-migration-lib directory, run the test command:

```
npm run test:migration
```
