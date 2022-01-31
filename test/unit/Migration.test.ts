import { assert, expect } from 'chai'
import { AbiItem } from 'web3-utils/types'
import { TestContractHandler } from '../TestContractHandler'
import Web3 from 'web3'
import { Migration } from '../../src/migration/Migration'
import IERC20 from '@oceanprotocol/contracts/artifacts/contracts/interfaces/IERC20.sol/IERC20.json'
import ERC721Factory from '@oceanprotocol/contracts/artifacts/contracts/ERC721Factory.sol/ERC721Factory.json'
import ERC721Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC721Template.sol/ERC721Template.json'
import SideStaking from '@oceanprotocol/contracts/artifacts/contracts/pools/ssContracts/SideStaking.sol/SideStaking.json'
import Router from '@oceanprotocol/contracts/artifacts/contracts/pools/FactoryRouter.sol/FactoryRouter.json'
import ERC20Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC20Template.sol/ERC20Template.json'
import Dispenser from '@oceanprotocol/contracts/artifacts/contracts/pools/dispenser/Dispenser.sol/Dispenser.json'
import FixedRate from '@oceanprotocol/contracts/artifacts/contracts/pools/fixedRate/FixedRateExchange.sol/FixedRateExchange.json'
import OPFCommunityFeeCollector from '@oceanprotocol/contracts/artifacts/contracts/communityFee/OPFCommunityFeeCollector.sol/OPFCommunityFeeCollector.json'
import PoolTemplate from '@oceanprotocol/contracts/artifacts/contracts/pools/balancer/BPool.sol/BPool.json'
import { ZERO_ADDRESS, ONE_ADDRESS } from '../../src/utils/Constants'
import BN from 'bn.js'
const web3 = new Web3('http://127.0.0.1:8545')

describe('Migration test', () => {
  let v3DtOwner: string
  let user1: string
  let user2: string
  let daemon: string
  let v3dt1Address: string
  let v3dt2Address: string
  let v3pool1Address: string
  let v3pool2Address: string
  let migrationAddress: string
  let contracts: TestContractHandler
  let migration: Migration
  let oceanAddress: string
  let migrationStakingAddress: string

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
    daemon = contracts.accounts[9]

    await contracts.deployContracts(v3DtOwner, daemon, Router.abi as AbiItem[])
    //console.log(contracts)
    v3dt1Address = contracts.v3dt1Address
    v3dt2Address = contracts.v3dt2Address
    v3pool1Address = contracts.v3pool1Address
    v3pool2Address = contracts.v3pool2Address
    migrationAddress = contracts.migrationAddress
    oceanAddress = contracts.oceanAddress
    migrationStakingAddress = contracts.migrationStakingAddress
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
  it('#getDaemon - should return Daemon address', async () => {
    expect(await migration.getDaemon(migrationAddress)).to.equal(
      daemon // in this test Daemon is accounts[9]
    )
  })
  describe('Migration has not started,status == notStarted', () => {
    it('#startMigration - should revert if not V3DtOwner', async () => {
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
      ).to.equal('0')
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address))
          .poolV3Address
      ).to.equal(ZERO_ADDRESS)

      // TODO: update with proper error handling in Migration class instead of catching it from on-chain, then update assertions
      try {
        await migration.startMigration(
          user1, // user1 is not the v3 dt owner/minter
          migrationAddress,
          v3dt1Address,
          v3pool1Address,
          'didV3',
          'tokenURI',
          ['NFTname', 'NFTsymbol'],
          ['ERC20name', 'ERC20symbol']
        )
      } catch (e) {
        //  console.log(e.message)
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Caller is not the datatoken publisher'"
        )
      }

      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
      ).to.equal('0')
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address))
          .poolV3Address
      ).to.equal(ZERO_ADDRESS)
    })
    it('#addShares - should revert if migration has not started', async () => {
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

      try {
        await migration.addShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          web3.utils.toWei('50')
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Adding shares is not currently allowed'"
        )
      }

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
    it('#removeShares - should revert if migration has not started', async () => {
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('0'))

      try {
        await migration.removeShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          web3.utils.toWei('50')
        )
      } catch (e) {
        // console.log(e.message)
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow share removal'"
        )
      }

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
    it('#thrsholdMet - should return false if NO LPT LOCKED', async () => {
      expect(
        await migration.thresholdMet(migrationAddress, v3pool1Address)
      ).to.equal(false)
    })
    it('#cancelMigration - should fail to call if not Contract owner or v3DTOwner', async () => {
      try {
        await migration.cancelMigration(user1, migrationAddress, v3pool1Address)
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Not OPF or DT owner'"
        )
      }
    })
    it('#liquidateAndCreatePool - should fail to call if status != allowed', async () => {
      try {
        await migration.liquidateAndCreatePool(
          user1,
          migrationAddress,
          v3pool1Address,
          ['1', '1']
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow to liquidate Pool'"
        )
      }
    })
    it('#setMetadataAndTransferNFT - daemon should fail to call if status != migrated', async () => {
      const poolAddress = '0xAAB9EaBa1AA2653c1Dda9846334700b9F5e14E44' // v4 pool doesn't exist yet so we use a dummy value

      const metaDataDecryptorUrlAndAddress = ['http://myprovider:8030', '0x123']
      const flagsAndData = [
        web3.utils.asciiToHex('0x01'),
        web3.utils.asciiToHex('SomeData')
      ]
      const metaDataState = '1'
      const metadataHash = web3.utils.keccak256('METADATA')
      const didV4 = 'did:op:0x2121'

      try {
        await migration.setMetadataAndTransferNFT(
          daemon,
          migrationAddress,
          poolAddress,
          metaDataState,
          metaDataDecryptorUrlAndAddress,
          flagsAndData,
          metadataHash,
          didV4
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Migration not completed yet'"
        )
      }
    })
    it('#setMetadataAndTransferNFT - user should fail to call if NOT daemon', async () => {
      const poolAddress = '0xAAB9EaBa1AA2653c1Dda9846334700b9F5e14E44' // v4 pool doesn't exist yet so we use a dummy value

      const metaDataDecryptorUrlAndAddress = ['http://myprovider:8030', '0x123']
      const flagsAndData = [
        web3.utils.asciiToHex('0x01'),
        web3.utils.asciiToHex('SomeData')
      ]
      const metaDataState = '1'
      const metadataHash = web3.utils.keccak256('METADATA')
      const didV4 = 'did:op:0x2121'

      try {
        await migration.setMetadataAndTransferNFT(
          user1,
          migrationAddress,
          poolAddress,
          metaDataState,
          metaDataDecryptorUrlAndAddress,
          flagsAndData,
          metadataHash,
          didV4
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'ONLY OPF DAEMON'"
        )
      }
    })
    it('#getPoolStatus - should return default values', async () => {
      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )

      expect(poolStatus.status).to.equal('0')
      expect(poolStatus.poolV3Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.poolV4Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.didV3).to.equal('')
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.dtV3Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.totalOcean).to.equal('0')
      expect(poolStatus.totalDTBurnt).to.equal('0')
      expect(poolStatus.newLPTAmount).to.equal('0')
      expect(poolStatus.lptRounding).to.equal('0')
      expect(poolStatus.deadline).to.equal('0')
    })
    it('#getTokensDetails- should return default values', async () => {
      const tokensDetails = await migration.getTokensDetails(
        migrationAddress,
        v3pool1Address
      )

      expect(tokensDetails.erc721Address).to.equal(ZERO_ADDRESS)
      expect(tokensDetails.dtV4Address).to.equal(ZERO_ADDRESS)
      expect(tokensDetails.nftName).to.equal('')
      expect(tokensDetails.nftSymbol).to.equal('')
      expect(tokensDetails.tokenURI).to.equal('')
      expect(tokensDetails.erc20Name).to.equal('')
      expect(tokensDetails.erc20Symbol).to.equal('')
    })
    it('#getSharesAllocation- should return default values for any user', async () => {
      let sharesAllocation = await migration.getShareAllocation(
        migrationAddress,
        v3pool1Address,
        user1
      )

      expect(sharesAllocation.userV3Shares).to.equal('0')
      expect(sharesAllocation.userV4Shares).to.equal('0')
      expect(sharesAllocation.alreadyAdded).to.equal(false)

      sharesAllocation = await migration.getShareAllocation(
        migrationAddress,
        v3pool1Address,
        v3DtOwner
      )

      expect(sharesAllocation.userV3Shares).to.equal('0')
      expect(sharesAllocation.userV4Shares).to.equal('0')
      expect(sharesAllocation.alreadyAdded).to.equal(false)
    })
  })
  describe('Migration has started, status == allowed', () => {
    it('#startMigration - should succed to call startMigration if v3DtOwner', async () => {
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
      ).to.equal('0')
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address))
          .poolV3Address
      ).to.equal(ZERO_ADDRESS)

      const txReceipt = await migration.startMigration(
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

      expect(txReceipt.events.Started != null)

      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )
      // console.log(poolStatus)
      expect(poolStatus.status).to.equal('1')
      expect(poolStatus.poolV3Address).to.equal(v3pool1Address)
      expect(poolStatus.didV3).to.equal('didV3')
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.owner).to.equal(v3DtOwner)
      expect(poolStatus.poolV4Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.dtV3Address).to.equal(v3dt1Address)
      expect(poolStatus.poolShareOwners.length).to.equal(0)
      expect(poolStatus.totalOcean).to.equal('0')
      expect(poolStatus.totalDTBurnt).to.equal('0')
      expect(poolStatus.newLPTAmount).to.equal('0')
      expect(poolStatus.lptRounding).to.equal('0')
    })
    it('#startMigration - reverts if has already started.', async () => {
      try {
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
      } catch (e) {
        // console.log(e.message)
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Migration process has already been started'"
        )
      }
    })
    // In this part we are going to unit test with threshold NOT met
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
    it('#removeShares - reverts when user requests removal of more shares than they have added.', async () => {
      const shares = web3.utils.toWei('50')
      expect(shares).to.equal(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      )

      try {
        await migration.removeShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          new BN(shares).add(new BN(10)).toString() // more that we actually have
        )
      } catch (e) {
        //console.log(e.message)
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'User does not have sufficient shares locked up'"
        )
      }
    })
    it('#removeShares - should remove shares if deadline has not passed.', async () => {
      expect(
        parseInt(
          (await migration.getPoolStatus(migrationAddress, v3pool1Address))
            .deadline
        )
      ).gt(await web3.eth.getBlockNumber())

      await migration.removeShares(
        v3DtOwner,
        migrationAddress,
        v3pool1Address,
        web3.utils.toWei('25')
      )

      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('25'))
    })
    it('#thresholdMet - should return false for 0 LPT LOCKED', async () => {
      expect(
        await migration.thresholdMet(migrationAddress, v3pool1Address)
      ).to.equal(false)
    })
    it('#cancelMigration - should fail to call if not Contract owner or v3DTOwner', async () => {
      try {
        await migration.cancelMigration(user1, migrationAddress, v3pool1Address)
      } catch (e) {
        //console.log(e.message)
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Not OPF or DT owner'"
        )
      }
    })
    it('#cancelMigration - should succeed to cancel if threshold not met and status == allowed', async () => {
      //TODO: check direct balance after returning v3 LPTs when cancelled
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
      ).to.equal('1')
      await migration.cancelMigration(
        v3DtOwner,
        migrationAddress,
        v3pool1Address
      )
      expect(
        (await migration.getPoolStatus(migrationAddress, v3pool1Address)).status
      ).to.equal('0')

      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal('0')
    })
    it('#liquidateAndCreatePool - should fail to call if status != allowed', async () => {
      try {
        await migration.liquidateAndCreatePool(
          user1,
          migrationAddress,
          v3pool1Address,
          ['1', '1']
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow to liquidate Pool'"
        )
      }
    })
    it('#getPoolStatus - should return default values', async () => {
      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )

      expect(poolStatus.status).to.equal('0')
      expect(poolStatus.poolV3Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.poolV4Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.didV3).to.equal('')
      expect(poolStatus.didV4).to.equal('')
      expect(poolStatus.dtV3Address).to.equal(ZERO_ADDRESS)
      expect(poolStatus.totalOcean).to.equal('0')
      expect(poolStatus.totalDTBurnt).to.equal('0')
      expect(poolStatus.newLPTAmount).to.equal('0')
      expect(poolStatus.lptRounding).to.equal('0')
      expect(poolStatus.deadline).to.equal('0')
    })
    it('#getTokensDetails- should return default values', async () => {
      const tokensDetails = await migration.getTokensDetails(
        migrationAddress,
        v3pool1Address
      )

      expect(tokensDetails.erc721Address).to.equal(ZERO_ADDRESS)
      expect(tokensDetails.dtV4Address).to.equal(ZERO_ADDRESS)
      expect(tokensDetails.nftName).to.equal('')
      expect(tokensDetails.nftSymbol).to.equal('')
      expect(tokensDetails.tokenURI).to.equal('')
      expect(tokensDetails.erc20Name).to.equal('')
      expect(tokensDetails.erc20Symbol).to.equal('')
    })
    it('#getSharesAllocation- should return default values for any user', async () => {
      let sharesAllocation = await migration.getShareAllocation(
        migrationAddress,
        v3pool1Address,
        user1
      )

      expect(sharesAllocation.userV3Shares).to.equal('0')
      expect(sharesAllocation.userV4Shares).to.equal('0')
      expect(sharesAllocation.alreadyAdded).to.equal(false)

      sharesAllocation = await migration.getShareAllocation(
        migrationAddress,
        v3pool1Address,
        v3DtOwner
      )

      expect(sharesAllocation.userV3Shares).to.equal('0')
      expect(sharesAllocation.userV4Shares).to.equal('0')
      expect(sharesAllocation.alreadyAdded).to.equal(false)
    })
    it('Migration successfully restarts', async () => {
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
      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )
      expect(poolStatus.status).to.equal('1')
      expect(poolStatus.poolV3Address).to.equal(v3pool1Address)
      expect(poolStatus.didV3).to.equal('didV3')
    })

    // Now we add enough shares so we can unit test with threshold met
    it('#addShares - all user add their LPTs, Threshold is MET', async () => {
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('0'))
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user1
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('0'))
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user2
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('0'))

      await migration.approve(
        v3DtOwner,
        v3pool1Address,
        migrationAddress,
        web3.utils.toWei('50')
      )
      await migration.approve(
        user1,
        v3pool1Address,
        migrationAddress,
        web3.utils.toWei('30')
      )
      await migration.approve(
        user2,
        v3pool1Address,
        migrationAddress,
        web3.utils.toWei('19')
      )

      await migration.addShares(
        v3DtOwner,
        migrationAddress,
        v3pool1Address,
        web3.utils.toWei('50')
      )
      await migration.addShares(
        user1,
        migrationAddress,
        v3pool1Address,
        web3.utils.toWei('30')
      )
      // we don't add the full amount because actually the pool can't be fully removed (balancer pool logic requires 1000 wei or around to be kept)
      await migration.addShares(
        user2,
        migrationAddress,
        v3pool1Address,
        web3.utils.toWei('19')
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
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user1
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('30'))
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user2
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('19'))

      expect(
        await migration.thresholdMet(migrationAddress, v3pool1Address)
      ).to.equal(true)
    })

    // A migration cannot be cancelled if threshold is MET (anytime but here tested before deadline)
    it('#cancelMigration - should fail to cancel if threshold is MET (before DEADLINE)', async () => {
      try {
        await migration.cancelMigration(
          v3DtOwner,
          migrationAddress,
          v3pool1Address
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Threshold already met'"
        )
      }
    })
    it('#liquidateAndCreatePool - should fail to call BEFORE deadline even if threshold is MET', async () => {
      try {
        await migration.liquidateAndCreatePool(
          user1,
          migrationAddress,
          v3pool1Address,
          ['1', '1']
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Cannot be called before deadline'"
        )
      }
    })

    it('#setMetadataAndTransferNFT - daemon should fail to call if status != migrated', async () => {
      const poolAddress = '0xAAB9EaBa1AA2653c1Dda9846334700b9F5e14E44' // v4 pool doesn't exist yet so we use a dummy value

      const metaDataDecryptorUrlAndAddress = ['http://myprovider:8030', '0x123']
      const flagsAndData = [
        web3.utils.asciiToHex('0x01'),
        web3.utils.asciiToHex('SomeData')
      ]
      const metaDataState = '1'
      const metadataHash = web3.utils.keccak256('METADATA')
      const didV4 = 'did:op:0x2121'

      try {
        await migration.setMetadataAndTransferNFT(
          daemon,
          migrationAddress,
          poolAddress,
          metaDataState,
          metaDataDecryptorUrlAndAddress,
          flagsAndData,
          metadataHash,
          didV4
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Migration not completed yet'"
        )
      }
    })
    it('# check current states and advance blocks AFTER deadline', async () => {
      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )
      expect(poolStatus.status).to.equal('1')
      expect(poolStatus.poolV3Address).to.equal(v3pool1Address)
      expect(poolStatus.didV3).to.equal('didV3')
      expect(
        await migration.thresholdMet(migrationAddress, v3pool1Address)
      ).to.equal(true)
      expect(
        parseInt(
          (await migration.getPoolStatus(migrationAddress, v3pool1Address))
            .deadline
        )
      ).gt(await web3.eth.getBlockNumber())
      // we need to advance some block so we send some transactions

      for (let i = 0; i < 100; i++) {
        // each one advance a block
        await web3.eth.sendTransaction({
          from: user1,
          to: user2,
          value: '0'
        })
      }
      // deadline has passed we can now liquidate anytime
      expect(await web3.eth.getBlockNumber()).gt(
        parseInt(
          (await migration.getPoolStatus(migrationAddress, v3pool1Address))
            .deadline
        )
      )

      expect(
        await migration.thresholdMet(migrationAddress, v3pool1Address)
      ).to.equal(true)
    })

    it('#addShares - adding shares not allowed if DEADLINE has passed.', async () => {
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('50'))

      await migration.approve(
        v3DtOwner,
        v3pool1Address,
        migrationAddress,
        web3.utils.toWei('50')
      )

      try {
        await migration.addShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          web3.utils.toWei('50')
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Deadline reached for adding shares'"
        )
      }

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

    it('#removeShares - removing shares not allowed if DEADLINE has passed.', async () => {
      const shares = web3.utils.toWei('50')
      expect(shares).to.equal(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      )

      try {
        await migration.removeShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          shares
        )
      } catch (e) {
        //console.log(e.message)
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Deadline reached for removing shares'"
        )
      }
    })
    it('#cancelMigration - should fail to cancel if threshold is MET (AFTER deadline)', async () => {
      try {
        await migration.cancelMigration(
          v3DtOwner,
          migrationAddress,
          v3pool1Address
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Threshold already met'"
        )
      }
    })

    it('#liquidateAndCreatePool - we now liquidate the pool', async () => {
      const txReceipt = await migration.liquidateAndCreatePool(
        user1,
        migrationAddress,
        v3pool1Address,
        ['1', '1']
      )

      assert(txReceipt.events.NewPool.event === 'NewPool')
      const args = txReceipt.events.NewPool.returnValues
      console.log(args)
      const nftAddress = args.nftAddress
      const v4dtAddress = args.newDTAddress
      const newPoolAddress = args.newPool
      const v3DTAddress = args.v3DTAddress

      const poolStatus = await migration.getPoolStatus(
        migrationAddress,
        v3pool1Address
      )
      const tokensDetails = await migration.getTokensDetails(
        migrationAddress,
        v3pool1Address
      )
      expect(v3DTAddress).to.equal(poolStatus.dtV3Address)
      expect(nftAddress).to.equal(tokensDetails.erc721Address)
      expect(v4dtAddress).to.equal(tokensDetails.dtV4Address)
      expect(newPoolAddress).to.equal(poolStatus.poolV4Address)
      // Pool has been migrated (index 2)
      expect(poolStatus.status).to.equal('2')

      const newPool = new web3.eth.Contract(
        PoolTemplate.abi as AbiItem[],
        newPoolAddress
      )
      //console.log(newPool)

      const oceanContract = new web3.eth.Contract(
        IERC20.abi as AbiItem[],
        oceanAddress
      )
      const v4DT = new web3.eth.Contract(
        ERC20Template.abi as AbiItem[],
        v4dtAddress
      )
      const nft = new web3.eth.Contract(
        ERC721Template.abi as AbiItem[],
        nftAddress
      )

      const v3DT = new web3.eth.Contract(
        ERC20Template.abi as AbiItem[],
        v3DTAddress
      )

      // NFT is still in the Migration contract
      expect(await nft.methods.ownerOf(1).call()).to.equal(migrationAddress)

      // v3DT owner hasn't received any v4 dts
      expect(await v4DT.methods.balanceOf(v3DtOwner).call()).to.equal('0')
      //   // NO OCEAN, nor v3 dts stay in the migrationStaking

      expect(
        await oceanContract.methods.balanceOf(migrationStakingAddress).call()
      ).to.equal('0')
      expect(
        await v3DT.methods.balanceOf(migrationStakingAddress).call()
      ).to.equal('0')

      // max cap is minted into the migrationStaking,
      // balance in migrationStaking is cap minus what we added in the pool
      expect(
        new BN(
          await v4DT.methods.balanceOf(migrationStakingAddress).call()
        ).toString()
      ).to.equal(
        new BN(await v4DT.methods.cap().call())
          .sub(new BN(await v4DT.methods.balanceOf(newPoolAddress).call()))
          .toString()
      )

      // NO OCEAN, nor v3 or v4 dt stay in migration
      expect(await v4DT.methods.balanceOf(migrationAddress).call()).to.equal(
        '0'
      )
      expect(
        await oceanContract.methods.balanceOf(migrationAddress).call()
      ).to.equal('0')
      expect(await v3DT.methods.balanceOf(migrationAddress).call()).to.equal(
        '0'
      )
      // v3DTs were sent to the address(1)
      expect(await v3DT.methods.balanceOf(ONE_ADDRESS).call()).to.equal(
        poolStatus.totalDTBurnt
      )
      // same amount of token burnt in address one to equal new v4dt balance in pool
      // Both all the new dts and all oceans are in the pool
      expect(await v4DT.methods.balanceOf(newPoolAddress).call()).to.equal(
        poolStatus.totalDTBurnt
      )
      expect(
        await oceanContract.methods.balanceOf(newPoolAddress).call()
      ).to.equal(poolStatus.totalOcean)

      // total new LPT amount is equal to the sum of the LP PROVIDERS + what might be left in the migration contract
      expect(poolStatus.newLPTAmount).to.equal(
        new BN(await newPool.methods.balanceOf(v3DtOwner).call())
          .add(new BN(await newPool.methods.balanceOf(migrationAddress).call()))
          .add(new BN(await newPool.methods.balanceOf(user1).call()))
          .add(new BN(await newPool.methods.balanceOf(user2).call()))
          .toString()
      )

      // check we stored the information properly
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV4Shares
      ).to.equal(await newPool.methods.balanceOf(v3DtOwner).call())
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user1
          )
        ).userV4Shares
      ).to.equal(await newPool.methods.balanceOf(user1).call())
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            user2
          )
        ).userV4Shares
      ).to.equal(await newPool.methods.balanceOf(user2).call())
    })

    it('#addShares -  adding shares not allowed if status != allowed', async () => {
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

      try {
        await migration.addShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          web3.utils.toWei('50')
        )
      } catch (e) {
        assert(
          e.message ==
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Adding shares is not currently allowed'"
        )
      }

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
    it('#removeShares -  adding shares not allowed if status != allowed.', async () => {
      expect(
        (
          await migration.getShareAllocation(
            migrationAddress,
            v3pool1Address,
            v3DtOwner
          )
        ).userV3Shares
      ).to.equal(web3.utils.toWei('0'))

      try {
        await migration.removeShares(
          v3DtOwner,
          migrationAddress,
          v3pool1Address,
          web3.utils.toWei('50')
        )
      } catch (e) {
        // console.log(e.message)
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow share removal'"
        )
      }

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
    it('#cancelMigration - should fail to cancel if already migrated', async () => {
      try {
        await migration.cancelMigration(
          v3DtOwner,
          migrationAddress,
          v3pool1Address
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow to cancel Pool'"
        )
      }
    })
    it('#liquidateAndCreatePool - should fail to call AGAIN ', async () => {
      try {
        await migration.liquidateAndCreatePool(
          user1,
          migrationAddress,
          v3pool1Address,
          ['1', '1']
        )
      } catch (e) {
        assert(
          e.message ===
            "Returned error: Error: VM Exception while processing transaction: reverted with reason string 'Current pool status does not allow to liquidate Pool'"
        )
      }
    })
  })
})
