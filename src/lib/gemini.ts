import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

import { supabase } from "@/integrations/supabase/client";

export async function generateIssueSummary(
  title: string,
  location: string | null,
  imagePaths?: string[] | null
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert Supabase storage paths to public URLs (best-effort)
    const imageUrls: string[] = [];
    if (imagePaths && imagePaths.length > 0) {
      for (const path of imagePaths) {
        try {
          const { data } = supabase.storage
            .from("issue-images")
            .getPublicUrl(path);
          if (data?.publicUrl) imageUrls.push(data.publicUrl);
        } catch (e) {
          // ignore individual image conversion failures
          console.warn("Failed to build public URL for image", path, e);
        }
      }
    }

    // Build a clear prompt that includes the image URLs (if any).
    const promptParts: string[] = [
      "You are an assistant that summarizes civic issue reports for municipal officials.",
      "Produce a concise, factual summary (2-3 sentences) that highlights key points and potential community impact.",
      "Do not add titles, labels, markdown, or asterisks — only output the plain summary text.",
    ];

    promptParts.push(`Title: ${title}`);
    if (location) promptParts.push(`Location: ${location}`);

    if (imageUrls.length > 0) {
      promptParts.push("Images (public URLs):");
      for (let i = 0; i < imageUrls.length; i++) {
        promptParts.push(`Image ${i + 1}: ${imageUrls[i]}`);
      }
      promptParts.push(
        "In the summary, directly describe any visible damage, hazards, or landmarks from the images without mentioning that they are images or attachments."
      );
    }

    const prompt = promptParts.join("\n");

    // Keep using generateContent with the constructed prompt (fallback to URL-based image context).
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Unable to generate summary at this time.";
  }
}
