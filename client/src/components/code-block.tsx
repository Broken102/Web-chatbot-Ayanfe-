import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting helper
  const highlightCode = (code: string, language: string) => {
    let highlightedCode = code;
    
    // Basic keyword highlighting based on language
    if (language === 'javascript') {
      highlightedCode = highlightJavascript(code);
    } else if (language === 'python') {
      highlightedCode = highlightPython(code);
    } else if (language === 'php') {
      highlightedCode = highlightPhp(code);
    }
    
    return highlightedCode;
  };
  
  const highlightJavascript = (code: string) => {
    return code
      .replace(/\/\/.*/g, '<span class="text-slate-500">$&</span>') // Comments
      .replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-amber-500">$&</span>') // Strings
      .replace(/\b(const|let|var|function|async|await|if|else|return|for|while|try|catch)\b/g, '<span class="text-purple-500">$&</span>') // Keywords
      .replace(/\b(console|JSON|fetch|document|Math|Array|Object)\b/g, '<span class="text-blue-500">$&</span>') // Built-ins
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-red-500">$&</span>'); // Literals
  };
  
  const highlightPython = (code: string) => {
    return code
      .replace(/\#.*/g, '<span class="text-slate-500">$&</span>') // Comments
      .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-amber-500">$&</span>') // Strings
      .replace(/\b(import|from|def|class|if|elif|else|for|while|try|except|return|with|as)\b/g, '<span class="text-purple-500">$&</span>') // Keywords
      .replace(/\b(print|len|str|int|float|list|dict|set|tuple)\b/g, '<span class="text-blue-500">$&</span>') // Built-ins
      .replace(/\b(True|False|None)\b/g, '<span class="text-red-500">$&</span>'); // Literals
  };
  
  const highlightPhp = (code: string) => {
    return code
      .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '<span class="text-slate-500">$&</span>') // Comments
      .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-amber-500">$&</span>') // Strings
      .replace(/\b(function|class|if|else|foreach|for|while|try|catch|return|require|include)\b/g, '<span class="text-purple-500">$&</span>') // Keywords
      .replace(/\b(array|echo|print|json_encode|json_decode|curl_init|curl_setopt|curl_exec|curl_close)\b/g, '<span class="text-blue-500">$&</span>') // Built-ins
      .replace(/\b(true|false|null)\b/g, '<span class="text-red-500">$&</span>') // Literals
      .replace(/(\$\w+)\b/g, '<span class="text-green-500">$&</span>'); // Variables
  };

  return (
    <div className="relative">
      <pre className="p-4 rounded-md bg-slate-900 text-slate-100 overflow-x-auto font-mono text-sm">
        <div dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default CodeBlock;