import {
  getBirdsKanariaByAccount,
  getItemsKanariaByAccount,
  getSingularByAccount
} from "@polkadot/extension-koni-base/api/rmrk_nft";
import fetch from "node-fetch";
import {SINGULAR_COLLECTION_ENDPOINT} from "@polkadot/extension-koni-base/api/rmrk_nft/config";
import {NftCollection, NftItem, NftJson} from "@polkadot/extension-koni-base/stores/types";

export const handleRmrkNfts = async (account: string) => {
  if (!account) return;

  try {
    const [singular, birds, items] = await Promise.all([
      getSingularByAccount('DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW'),
      getBirdsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'),
      getItemsKanariaByAccount('Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr')
    ])
    const allNfts = [...singular, ...birds, ...items]
    let allCollections: any[] = []
    let collectionInfoUrl: string[] = []
    allNfts.map(item => {
      const url = SINGULAR_COLLECTION_ENDPOINT + item.collectionId
      if (!collectionInfoUrl.includes(url)) {
        allCollections.push({collectionId: item.collectionId})
        collectionInfoUrl.push(url)
      }
    })

    const collectionInfo = await Promise.all(collectionInfoUrl.map(async url => {
      const resp = await fetch(url);
      const data: any[] = await resp.json();
      if (data.length > 0) return data[0]
      else return {}
    }))

    let collectionInfoDict = Object.assign({}, ...collectionInfo.map((item) => ({[item.id]: item.name})));
    let nftDict = {}
    for (let item of allNfts) {
      const parsedItem = {
        id: item?.id,
        name: item?.metadata?.name,
        image: item?.metadata?.image,
        external_url: '',
        rarity: item?.metadata_rarity,
        collectionId: item?.collectionId,
        properties: item?.metadata?.properties
      } as NftItem

      if (item.collectionId in nftDict) {
        // @ts-ignore
        nftDict[item.collectionId] = [...nftDict[item.collectionId], parsedItem]
      }
      else {
        // @ts-ignore
        nftDict[item.collectionId] = [parsedItem]
      }
    }

    allCollections = allCollections.map(item => {
      return {
        collectionId: item.collectionId,
        collectionName: collectionInfoDict[item.collectionId] ? collectionInfoDict[item.collectionId] : null,
        // @ts-ignore
        nftItems: nftDict[item.collectionId]
      } as NftCollection
    })

    // should return list of NftCollection
    return {total: allNfts.length, allCollections}
  } catch (e) {
    console.error('Failed to fetch nft', e);
    throw e;
  }
}


// should get all nfts from all sources
export const getAllNftsByAccount = async (account: string): Promise<NftJson> => {
    try {
      // @ts-ignore
      const {total, allCollections} = await handleRmrkNfts(account);
      return {
        total,
        nftList: allCollections
      } as NftJson
    } catch (e) {
      console.error('Failed to fetch nft', e);
      throw e;
    }
}