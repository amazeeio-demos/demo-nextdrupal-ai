import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { Document } from "langchain/document";
// import { OpenAI } from "langchain/llms/openai";

import composetheweb from "./composetheweb.json";

export const run = async () => {

  const docs: Document[] = composetheweb.data
    .filter((doc) => doc.type === 'node--recipe' || doc.type === 'node--article')
    .map((doc) => {
      if (doc.type === 'node--recipe') {
        return new Document({
          metadata: { source: doc.links.self.href },
          pageContent:
          `
          Title: ${doc.attributes.title},
          Difficulty: ${doc.attributes.field_difficulty},
          Ingredients: ${doc.attributes.field_ingredients},
          Recipe: ${doc.attributes.field_recipe_instruction?.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")},
          Summary: ${doc.attributes.field_summary?.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")}
          `
        })
      }
      const pageContent = `Title: ${doc.attributes.title} - ${doc.attributes.body!.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")}`
      return new Document({ metadata: { source: doc.links.self.href }, pageContent})
    })

  // const llm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY!, temperature: 0 });
  // docs.map(async (doc) => {
  //   console.log(doc.pageContent)
  //   console.log(await llm.getNumTokens(doc.pageContent))
  // })

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({modelName: "text-embedding-ada-002"}));
  await vectorStore.save("data");
};

(async () => {
  await run();
  console.log("done");
})();
