// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { makeChain } from './util'
import { Message } from '@/types'
/*
import { z } from "zod";

import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";

const SourceSchema = z.object({
  answer: z.string().describe("answer to the user's question"),
  sources: z
    .array(z.string())
    .describe("sources used to answer the question, should be websites."),
  titles: z
    .array(z.string())
    .describe("titles used to answer the question."),
})

type Sources = z.infer<typeof SourceSchema>;

const llmReasoning = async (question: string, answer: string, sourceDocuments: any[]) => {

  // With a `StructuredOutputParser` we can define a schema for the output.
  const parser = StructuredOutputParser.fromZodSchema(
    SourceSchema
  );

  // const parser = StructuredOutputParser.fromNamesAndDescriptions({
  //   title: "title of the source document, should be a string",
  //   source: "source or sources used to answer the user's question, should be a list of urls or websites.",
  // });

  const formatInstructions = parser.getFormatInstructions();

  const prompt = new PromptTemplate({
    template: 'Provide the sources used to answer the question. sources and titles can be found in the sourceDocuments. If none of the sourceDocuments were used, return an empty array. \n Question: {question}\n Answer: {answer}\n Source Documents: {sourceDocuments} \n Format: {format_instructions}',
    inputVariables: ["question", "answer", "sourceDocuments"],
    partialVariables: { format_instructions: formatInstructions },
  });

  const model = new OpenAI({ temperature: 0, modelName: "gpt4" });

  const sourceSimplified = JSON.stringify(sourceDocuments.map(doc => ({ title: doc.metadata.title, source: doc.metadata.source })))

  const input = await prompt.format({
    question,
    answer,
    sourceDocuments: sourceSimplified,
  });
  const response = await model.call(input);
  console.log(response)
  return response
}
*/

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = req.body as { question: string; history: Message[] }
  const dir = path.resolve(process.cwd(), 'data')

  const chat_history = body.history
    .map((msg, i) => `${msg.role}: ${msg.content}.`)
    .join('\n')

  const vectorstore = await HNSWLib.load(dir, new OpenAIEmbeddings())
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  const sendData = (data: string) => {
    res.write(data)
  }
  const chain = await makeChain(vectorstore, (token: string) => {
    sendData(token)
  })

  try {
    const result = await chain.invoke({
      question: body.question,
      chat_history
    })

    // try {
    //   const sources = JSON.parse(await llmReasoning(body.question, result.text, result.sourceDocuments))
    //   const toWriteToStream = sources?.titles?.map(
    //     (title: string, i: number) => {
    //       return `[${title}](https://next.demo.composetheweb.com${sources.sources[i]})`
    //     }
    //   )
    //   if (toWriteToStream.length > 0) {
    //     res.write(`\n\nSources: **${toWriteToStream.join(', ')}**\n`)
    //   }
    // } catch (error) {
    //   console.log('sources could not be extracted')
    // }
  } catch (err) {
    console.error(err)
    // Ignore error
  } finally {
    res.end()
  }
}
