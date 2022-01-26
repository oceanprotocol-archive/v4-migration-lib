import { assert, expect } from 'chai'
import { AbiItem } from 'web3-utils/types'
import { TestContractHandler } from '../TestContractHandler'
import Web3 from 'web3'
import { Migration } from '../../src/migration/Migration'
import ERC721Factory from '@oceanprotocol/contracts/artifacts/contracts/ERC721Factory.sol/ERC721Factory.json'
import ERC721Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC721Template.sol/ERC721Template.json'
import SideStaking from '@oceanprotocol/contracts/artifacts/contracts/pools/ssContracts/SideStaking.sol/SideStaking.json'
import Router from '@oceanprotocol/contracts/artifacts/contracts/pools/FactoryRouter.sol/FactoryRouter.json'
import ERC20Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC20Template.sol/ERC20Template.json'
import Dispenser from '@oceanprotocol/contracts/artifacts/contracts/pools/dispenser/Dispenser.sol/Dispenser.json'
import FixedRate from '@oceanprotocol/contracts/artifacts/contracts/pools/fixedRate/FixedRateExchange.sol/FixedRateExchange.json'
import OPFCommunityFeeCollector from '@oceanprotocol/contracts/artifacts/contracts/communityFee/OPFCommunityFeeCollector.sol/OPFCommunityFeeCollector.json'
import PoolTemplate from '@oceanprotocol/contracts/artifacts/contracts/pools/balancer/BPool.sol/BPool.json'
import { ZERO_ADDRESS } from '../../src/utils/Constants'
const web3 = new Web3('http://127.0.0.1:8545')

describe('Migration test', () => {
  let v3DtOwner: string
  let user1: string
  let user2: string
  let v3dt1Address: string
  let v3dt2Address: string
  let v3pool1Address: string
  let v3pool2Address: string
  let migrationAddress: string
  let contracts: TestContractHandler
  let migration: Migration

  it('should deploy contracts', async () => {
    contracts = new TestContractHandler(
      web3,
      ERC721Template.abi as AbiItem[],
      ERC20Template.abi as AbiItem[],
      PoolTemplate.abi as AbiItem[],
      ERC721Factory.abi as AbiItem[],
      Router.abi as AbiItem[],
      SideStaking.abi as AbiItem[],
      FixedRate.abi as AbiItem[],
      Dispenser.abi as AbiItem[],
      OPFCommunityFeeCollector.abi as AbiItem[],

      ERC721Template.bytecode,
      ERC20Template.bytecode,
      PoolTemplate.bytecode,
      ERC721Factory.bytecode,
      Router.bytecode,
      SideStaking.bytecode,
      FixedRate.bytecode,
      Dispenser.bytecode,
      OPFCommunityFeeCollector.bytecode
    )
    await contracts.getAccounts()
    v3DtOwner = contracts.accounts[0]
    user1 = contracts.accounts[1]
    user2 = contracts.accounts[2]

    await contracts.deployContracts(v3DtOwner, Router.abi as AbiItem[])
    //console.log(contracts)
    v3dt1Address = contracts.v3dt1Address
    v3dt2Address = contracts.v3dt2Address
    v3pool1Address = contracts.v3pool1Address
    v3pool2Address = contracts.v3pool2Address
    migrationAddress = contracts.migrationAddress
  })

  it('should initiate Migration instance', async () => {
    migration = new Migration(web3)
    assert(migration != undefined, 'Failed to initialize Migration class')
  })

  it('#getNftFactory - should return Nft Factory address', async () => {
    expect(await migration.getNftFactory(migrationAddress)).to.equal(
      contracts.factory721Address
    )
  })
  it('#getOcean - should return Ocean address', async () => {
    expect(await migration.getOcean(migrationAddress)).to.equal(
      contracts.oceanAddress
    )
  })
  it('#getPoolTemplate - should return Pool template address', async () => {
    expect(await migration.getPoolTemplate(migrationAddress)).to.equal(
      contracts.poolTemplateAddress
    )
  })
  it('#startMigration - should succed to call startMigration', async () => {
    expect(
      (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
    ).to.equal('0')
    expect(
      (await migration.getPoolStatus(migrationAddress, v3pool1Address))
        .poolV3Address
    ).to.equal(ZERO_ADDRESS)

    await migration.startMigration(
      v3DtOwner,
      migrationAddress,
      v3dt1Address,
      v3pool1Address,
      'didV3',
      'tokenURI',
      ['NFTname', 'NFTsymbol'],
      ['ERC20name', 'ERC20symbol']
    )
    expect(
      (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
    ).to.equal('1')
    expect(
      (await migration.getPoolStatus(migrationAddress, v3pool1Address))
        .poolV3Address
    ).to.equal(v3pool1Address)
  })

  it('#addShares - v3DtOwner adds his LPTs', async () => {
    expect(
      (
        await migration.getShareAllocation(
          migrationAddress,
          v3pool1Address,
          v3DtOwner
        )
      ).userV3Shares
    ).to.equal(web3.utils.toWei('0'))

    await migration.approve(
      v3DtOwner,
      v3pool1Address,
      migrationAddress,
      web3.utils.toWei('50')
    )

    await migration.addShares(
      v3DtOwner,
      migrationAddress,
      v3pool1Address,
      web3.utils.toWei('50')
    )

    expect(
      (
        await migration.getShareAllocation(
          migrationAddress,
          v3pool1Address,
          v3DtOwner
        )
      ).userV3Shares
    ).to.equal(web3.utils.toWei('50'))
  })
  it('#removeShares - v3DtOwner remove his LPTs before deadline', async () => {
    expect(
      (
        await migration.getShareAllocation(
          migrationAddress,
          v3pool1Address,
          v3DtOwner
        )
      ).userV3Shares
    ).to.equal(web3.utils.toWei('50'))

    await migration.removeShares(
      v3DtOwner,
      migrationAddress,
      v3pool1Address,
      web3.utils.toWei('50')
    )

    expect(
      (
        await migration.getShareAllocation(
          migrationAddress,
          v3pool1Address,
          v3DtOwner
        )
      ).userV3Shares
    ).to.equal(web3.utils.toWei('0'))
  })
})