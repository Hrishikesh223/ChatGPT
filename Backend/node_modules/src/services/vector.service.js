// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });


const cohortChatgptIndex = pc.Index({
    name:"cohortchatgpt"});



async function createMemory({ text, metadata, messageID }) {
    if (!text || !messageID) return;
    await cohortChatgptIndex.upsertRecords({
    records: [
      {
        id: messageID.toString(),
        text: text,
        metadata: JSON.stringify(metadata)
      }
    ]
  });
}


// find most sementaic similar past messages from the vector database.
async function queryMemory({queryVector, limit = 5, metadata }) {
    const data = await cohortChatgptIndex.query({
        vector: queryVector,
        topK: limit,
        filter: metadata || undefined,
        includeMetadata: true
    })


    return data.matches
}


module.exports = { createMemory, queryMemory }