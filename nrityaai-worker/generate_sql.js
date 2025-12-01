const fs = require('fs');

const content = fs.readFileSync('./src/dance_resources.ts', 'utf8');

// Find start and end of danceResources object
const start = content.indexOf('export const danceResources = {');
const end = content.indexOf('\n}\n\n', start) + 2;
const objStr = content.substring(start + 'export const danceResources = '.length, end);

const danceResources = eval('(' + objStr + ')');

const inserts = ['DELETE FROM dance_resources;'];

Object.entries(danceResources).forEach(([style, styleData]) => {
  if (style === 'General') {
    styleData.forEach(resource => {
      inserts.push(`INSERT INTO dance_resources (title, url, description, style, level, category, type) VALUES ('${resource.title.replace(/'/g, "''")}', '${resource.url}', '${resource.description.replace(/'/g, "''")}', 'General', 'All', '${resource.category}', '${resource.type}');`);
    });
  } else {
    Object.entries(styleData).forEach(([level, resources]) => {
      resources.forEach(resource => {
        inserts.push(`INSERT INTO dance_resources (title, url, description, style, level, category, type) VALUES ('${resource.title.replace(/'/g, "''")}', '${resource.url}', '${resource.description.replace(/'/g, "''")}', '${style}', '${level}', '${resource.category}', '${resource.type}');`);
      });
    });
  }
});

fs.writeFileSync('./populate.sql', inserts.join('\n'));
console.log(`Generated ${inserts.length - 1} insert statements`);