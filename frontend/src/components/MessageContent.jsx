import React from 'react';
import ReactMarkdown from 'react-markdown';

const MessageContent = ({ content, isAI }) => {
  // Custom components for markdown rendering
  const components = {
    // Make text bold
    strong: ({ children }) => (
      <strong style={{ fontWeight: 'bold', color: isAI ? '#3D1F24' : '#F5E6D3' }}>
        {children}
      </strong>
    ),
    
    // Handle links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: isAI ? '#8B4049' : '#D4AF37',
          textDecoration: 'underline',
          fontWeight: '500'
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
        }}
      >
        {children}
      </a>
    ),
    
    // Handle paragraphs
    p: ({ children }) => (
      <p className="leading-relaxed mb-2 last:mb-0">
        {children}
      </p>
    ),
    
    // Handle lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 ml-2">
        {children}
      </ul>
    ),
    
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    )
  };

  // Function to detect and convert URLs to links
  const linkifyText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '[$1]($1)');
  };

  // Process the content to make URLs clickable
  const processedContent = linkifyText(content);

  return (
    <ReactMarkdown components={components}>
      {processedContent}
    </ReactMarkdown>
  );
};

export default MessageContent;