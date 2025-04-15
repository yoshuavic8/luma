import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase";

// Ensure API is protected and only accessible to authenticated users
export async function POST(request: Request) {
  try {
    // Get the verse data from the request
    const { verse } = await request.json();

    if (!verse || !verse.reference || !verse.text) {
      return NextResponse.json(
        { error: "Missing verse information" },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Create prompt for Mistral AI
    const prompt = `
Analyze the following Bible verse and provide comprehensive insights:

Reference: ${verse.reference}
Text: "${verse.text}"
Translation: ${verse.translation}

Please provide the following insights in a structured JSON format:

1. Historical Context: Provide the historical and cultural background of this verse, including information about the author, audience, time period, and relevant historical events.

2. Theological Insights: Explain the theological meaning and significance of this verse, including its place in biblical theology and doctrinal implications.

3. Application Points: List 3-5 practical ways this verse can be applied to modern life, with specific examples.

4. Sermon Ideas: Provide a sermon title and 3-5 main points that could be developed from this verse.

5. Cross References: List 3-5 other Bible verses that are thematically connected to this verse, including their text.

Format your response as a valid JSON object with the following structure:
{
  "historicalContext": "detailed paragraph about historical context",
  "theologicalInsights": "detailed paragraph about theological meaning",
  "applicationPoints": ["point 1", "point 2", "point 3", ...],
  "sermonIdeas": {
    "title": "sermon title",
    "points": ["point 1", "point 2", "point 3", ...]
  },
  "crossReferences": [
    {"reference": "Book Chapter:Verse", "text": "verse text"},
    ...
  ]
}

Ensure your response is thorough, biblically sound, and helpful for sermon preparation or Bible study.
`;

    // Call Mistral API
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content:
              "You are a biblical scholar and theologian with expertise in hermeneutics, biblical history, and practical application of scripture. Your task is to provide comprehensive insights on Bible verses to help pastors, teachers, and Bible students understand and apply the text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`Mistral API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse Mistral API response:", error);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Return the insights
    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error("Error in bible-insights API:", error);
    return NextResponse.json(
      { error: "Failed to generate Bible insights" },
      { status: 500 }
    );
  }
}
