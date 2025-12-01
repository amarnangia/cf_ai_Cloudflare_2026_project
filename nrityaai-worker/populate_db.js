const { danceResources } = require('./src/dance_resources.ts');

// Convert the dance resources to SQL insert statements
function generateInserts() {
  const inserts = [];
  
  Object.entries(danceResources).forEach(([style, styleData]) => {
    if (style === 'General') {
      // Handle general resources
      styleData.forEach(resource => {
        inserts.push(`INSERT INTO dance_resources (title, url, description, style, level, category, type) VALUES (
          '${resource.title.replace(/'/g, "''")}',
          '${resource.url}',
          '${resource.description.replace(/'/g, "''")}',
          'General',
          'All',
          '${resource.category}',
          '${resource.type}'
        );`);
      });
    } else {
      // Handle style-specific resources by level
      Object.entries(styleData).forEach(([level, resources]) => {
        resources.forEach(resource => {
          inserts.push(`INSERT INTO dance_resources (title, url, description, style, level, category, type) VALUES (
            '${resource.title.replace(/'/g, "''")}',
            '${resource.url}',
            '${resource.description.replace(/'/g, "''")}',
            '${style}',
            '${level}',
            '${resource.category}',
            '${resource.type}'
          );`);
        });
      });
    }
  });
  
  return inserts.join('\n');
}

console.log(generateInserts());