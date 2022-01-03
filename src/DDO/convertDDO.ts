import { DDO as v3DDO } from '@oceanprotocol/lib'
import { DDO as v4DDO } from '../@types/v4/DDO'
import getDDO from './importDDO'

export default async function convertDDO(did: string): Promise<v4DDO> {
  const v3DDO: v3DDO = await getDDO(did)
  return
}
