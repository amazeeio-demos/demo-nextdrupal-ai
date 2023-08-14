import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";

// JSON API Export from Drupal
import composetheweb from "./composetheweb.json";


const llm = new OpenAI({ temperature: 0, modelName: "gpt-4" });

const prompt = PromptTemplate.fromTemplate(`
You are a content tagging bot for a food and drink blog, and your role is to identify and tag recipes. Specify whether the item is a food or drink and then focus on the type (e.g., vegan, gluten-free), unique ingredients (e.g., dried fruit, super seeds), cooking or preparation techniques (e.g., grilling, soaking, mixing), dietary restrictions, cultural origins, meal or occasion types (e.g., breakfast, lunch, dinner, cocktail party), and special flavors or features (e.g., sweet, savory, spicy) that stand out in the given recipe.

Recipe: {recipe}

Please return the tags in a JSON array format, like this:

\`\`\`json
["Category: Drink", "Type: Vegan", "Unique Ingredients: Mint leaves", "Preparation Techniques: Mixing", "Dietary Restrictions: Gluten-free", "Cultural Origins: Cuban", "Occasion: Cocktail party", "Special Features: Refreshing"]
\`\`\`

Feel free to add any tags that may provide insightful information about the dish or drink. There's no maximum number of tags, so be thorough and descriptive in your tagging, as it helps readers find recipes that match their preferences.
`)

const chain = new LLMChain({ llm, prompt })
const generateTagsFromContent = async (content: string) => chain.call({ "recipe": content })

function parseCode(text: string, lang = ""): string {
  const pattern = new RegExp(`\`\`\`${lang}.*?\\s+(.*?)\`\`\``, 's');
  const match = pattern.exec(text);

  if (match) {
    return match[1];
  } else {
    console.log(`${pattern} not matched in the following text:`);
    console.log(text);
    return "[]"
  }
}

export const run = async () => {

  const docs = composetheweb.data
    .filter((doc) => doc.type === 'node--recipe' || doc.type === 'node--article')
    .map((doc) => {
      const metadata = { title: doc.attributes.title, source: doc.attributes.path.alias }
      if (doc.type === 'node--recipe') {
        const pageContent =
          `
        Title: ${doc.attributes.title},\n 
        Difficulty: ${doc.attributes.field_difficulty},\n\n 
        Ingredients: ${doc.attributes.field_ingredients},\n\n 
        Recipe: ${doc.attributes.field_recipe_instruction?.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")}, \n\n
        Summary: ${doc.attributes.field_summary?.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")}
        `

        return new Document({ metadata, pageContent })
      }
      const pageContent = `Title: ${doc.attributes.title} - ${doc.attributes.body!.value.replace(/<[^>]+>/g, "").replace(/\n/g, "")}`
      return new Document({ metadata, pageContent })
    })


  const generateTagPromises = docs.map(async ({ pageContent }) => generateTagsFromContent(pageContent))
  const tags = await Promise.all(generateTagPromises)

  // put the tags back into the docs meta field
  const updatedDocs = docs.map((doc, index) => {


    let parsed = parseCode(tags[index].text)
    try {
      parsed = JSON.parse(parsed).join(', ')
    } catch (error) {
      console.log(error)
    }
    return ({
      ...docs[index],
      metadata: { ...doc.metadata, tags: parsed }
    })

  })

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(updatedDocs, new OpenAIEmbeddings());
  await vectorStore.save("data");
};

(async () => {
  await run();
  console.log("done");
})();
