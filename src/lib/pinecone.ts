import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not defined');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const getPineconeIndex = () => {
  return pinecone.index('strideiq-9hr81y6').host(process.env.PINECONE_HOST || '');
};
