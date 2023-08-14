import { OpenAI } from 'langchain/llms/openai'
import {
  LLMChain,
  ConversationalRetrievalQAChain,
  loadQAChain,
} from 'langchain/chains'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import {
  BasePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts'
import path from 'path'
import { BufferMemory } from 'langchain/memory'
import { SelfQueryRetriever } from 'langchain/retrievers/self_query'
import { FunctionalTranslator } from 'langchain/retrievers/self_query/functional'
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression'
// import { ChatOpenAI } from 'langchain/dist/chat_models/openai'
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract'

import { AttributeInfo } from 'langchain/schema/query_constructor'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { Message, Role } from './types'

const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Human: {question}
Standalone question:`)

// If the question is not about a recipe or ingredients or composetheweb, politely inform them that you can only answer questions about food, recipes, and composetheweb.
const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant for a cooking and recipe website. 

You are given extracted parts of a long document and a question. 
Provide a conversational answer. 

If you don't know the answer, just say "Hmm, I'm not sure." NEVER make up an answer.


Question: {question}

=========
{context}
=========

RULES
- NEVER make up a hyperlink that is not the metadata.
- Always format ingredients in a list
- Bold heading text like Ingredients:, Recipe: Directions:, etc.
- Always include the source of all recipes or article as a hyperlink at the bottom of the response
- Never include the full recipe in the response unless specifically asked for
- Never include the ingredients in the response unless specifically asked for

=========
Answer in Markdown: `,
)

// { title: , source: , tags: }
const attributeInfo: AttributeInfo[] = [
  {
    name: 'title',
    description: 'The title of the recipe or article',
    type: 'string',
  },
  {
    name: 'source',
    description: 'The url of the recipe or article',
    type: 'string',
  },
  {
    name: 'tags',
    description: 'A list of the tags of the recipe or article comma separated',
    type: 'string or array of strings',
  },
]

const history: Message[] = [
  {
    content: "I'm looking for a recipe for a chocolate cake.",
    role: 'human',
  },
]

export const main = async () => {
  const dir = path.resolve(process.cwd(), 'data')
  const vectorstore = await HNSWLib.load(dir, new OpenAIEmbeddings())

  // const questionGenerator = new LLMChain({
  //   llm: new OpenAI({ temperature: 0 }),
  //   prompt: CONDENSE_PROMPT,
  // });

  const llm = new OpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  })

  const formattedHistory = history
    .map((msg, i) => `${msg.role}: ${msg.content}`)
    .join('\n')
  console.log(formattedHistory)

  // const documentContents = 'Brief summary of an article or recipe.'

  // const docChain = loadQAChain(llm, {
  //   prompt: QA_PROMPT,
  //   type: 'stuff',
  // })

  // const baseCompressor = LLMChainExtractor.fromLLM(llm)

  // const retriever = new ContextualCompressionRetriever({
  //   baseCompressor,
  //   baseRetriever: vectorStore.asRetriever({
  //     metadata: { title: true, source: true, tags: true },
  //   }),
  // })

  // const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
  //   llm,
  //   vectorStore,
  //   documentContents,
  //   attributeInfo,
  //   structuredQueryTranslator: new FunctionalTranslator(),
  // })

  // const chain = ConversationalRetrievalQAChain.fromLLM(llm, retriever, {
  //   questionGeneratorChainOptions: {
  //     template: CONDENSE_PROMPT.template,
  //   },
  //   qaChainOptions: {
  //     prompt: QA_PROMPT,
  //     type: 'stuff',
  //   },
  //   returnSourceDocuments: true,
  // })

  // verbose: true,
  // retriever: vectorstore.asRetriever({

  //   metadata: { title: true, source: true, tags: true }
  // }),
  // combineDocumentsChain: docChain,
  // questionGeneratorChain: questionGenerator,

  const prompt = PromptTemplate.fromTemplate(
    'What is a good name for a company that makes {product}?',
  )
  const chain = new LLMChain({ llm, prompt })
  const res = await chain.call({
    company: 'a startup',
    product: 'colorful socks',
  })
  console.log(res)
}
;(async () => {
  await main()
  console.log('done')
})()
