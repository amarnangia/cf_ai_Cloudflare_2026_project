const { danceResources } = require('./src/dance_resources.ts');

// Flatten resources for database insertion
const resources = [];

Object.entries(danceResources).forEach(([style, styleData]) => {
  if (Array.isArray(styleData)) {
    // General resources
    styleData.forEach(resource => {
      resources.push({
        style,
        level: 'General',
        title: resource.title,
        url: resource.url,
        description: resource.description,
        category: resource.category,
        type: resource.type
      });
    });
  } else {
    // Style-specific resources by level
    Object.entries(styleData).forEach(([level, levelData]) => {
      levelData.forEach(resource => {
        resources.push({
          style,
          level,
          title: resource.title,
          url: resource.url,
          description: resource.description,
          category: resource.category,
          type: resource.type
        });
      });
    });
  }
});

// Generate SQL insert statements
const insertStatements = resources.map(r => 
  `INSERT INTO dance_resources (style, level, title, url, description, category, type) VALUES ('${r.style}', '${r.level}', '${r.title.replace(/'/g, "''")}', '${r.url}', '${r.description.replace(/'/g, "''")}', '${r.category}', '${r.type}');`
);

console.log('DELETE FROM dance_resources;');
insertStatements.forEach(stmt => console.log(stmt));