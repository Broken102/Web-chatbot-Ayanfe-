
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import CodeBlock from "../code-block";

export function ApiDocs() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <h3 className="text-lg font-bold mb-2">Getting Started</h3>
            <p>The AYANFE AI API provides access to multiple AI and media services.</p>
          </TabsContent>
          
          <TabsContent value="authentication">
            <h3 className="text-lg font-bold mb-2">Authentication</h3>
            <p>All API requests require an API key passed in the Authorization header.</p>
          </TabsContent>
          
          <TabsContent value="endpoints">
            <h3 className="text-lg font-bold mb-2">Available Endpoints</h3>
            <ul className="list-disc pl-4">
              <li>POST /api/chat/ask - Chat with AI</li>
              <li>GET /api/images/search - Search images</li>
              <li>GET /api/waifu - Get anime images</li>
              <li>GET /api/neko - Get neko images</li>
            </ul>
          </TabsContent>
          
          <TabsContent value="examples">
            <CodeBlock 
              language="javascript"
              code={`
// Example API request
const response = await fetch('https://api.ayanfe.ai/chat/ask', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'Hello!'
  })
});
              `}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
