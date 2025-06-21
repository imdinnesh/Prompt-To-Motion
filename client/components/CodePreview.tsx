import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface CodePreviewProps {
    code: string;
}

export const CodePreview = ({ code }: CodePreviewProps) => {
    if (!code) return null;

    return (
        <Card className="mt-6 bg-gray-900/50 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="h-5 w-5 text-primary" />
                    Generated Python Code
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-60 overflow-y-auto rounded-md bg-[#1E1E1E] p-4">
                    <SyntaxHighlighter language="python" style={vscDarkPlus} showLineNumbers>
                        {code || "Waiting for code..."}
                    </SyntaxHighlighter>
                </div>
            </CardContent>
        </Card>
    );
};