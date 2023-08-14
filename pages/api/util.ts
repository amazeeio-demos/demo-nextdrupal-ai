import { OpenAI } from 'langchain/llms/openai'
import {
  LLMChain,
  ConversationalRetrievalQAChain,
  loadQAChain,
} from 'langchain/chains'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { PromptTemplate } from 'langchain/prompts'

const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Human: {question}
Standalone question:`)

// If the question is not about a recipe or ingredients or composetheweb, politely inform them that you can only answer questions about food, recipes, and composetheweb.
const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant for a food blog (https://next.demo.composetheweb.com). 

You are given extracted parts of a long document and a question. 
Provide a very brief conversational answer unless explicily asked for more.

If you don't know the answer, just say "Hmm, I'm not sure." NEVER make up an answer.


Question: {question}

=========
{context}
=========

RULES
- NEVER make up a hyperlink that is not in the context metadata.
- Always format ingredients in a list
- Bold heading text like Ingredients:, Recipe: Directions:, etc.
- Always include the source of all recipes or article as a hyperlink at the bottom of the response
- Never include the full recipe in the response unless specifically asked for
- Never include the ingredients in the response unless specifically asked for
- Never link the word "here" and always link and bold any title of a recipe or article
- Always link the title of a recipe or article to the source of the recipe or article

=========
Answer in Markdown: 
Source: 
`,
)

export const makeChain = async (
  vectorstore: HNSWLib,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  })

  const llm = new OpenAI({
    modelName: 'gpt-4',
    temperature: 0,
    streaming: Boolean(onTokenStream),
    callbacks: [
      {
        handleLLMNewToken: onTokenStream,
      },
    ],
  })

  const docChain = loadQAChain(llm, {
    prompt: QA_PROMPT,
    type: 'stuff',
  })

  const chain = new ConversationalRetrievalQAChain({
    // verbose: true,
    retriever: vectorstore.asRetriever({
      metadata: { title: true, source: true, tags: true },
    }),
    returnSourceDocuments: true,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  })


  return chain
}
