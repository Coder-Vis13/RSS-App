const pool = require("../config/db"); 
const Parser = require('rss-parser');
const parser = new Parser();
const htmlparser2 = require('htmlparser2');
const sanitizeHtml = require('sanitize-html');
const he = require('he');


const homePage = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};


// clean up source first to make sure it looks right
function fixSourceItem(sourceItem) {
  const cleanTitle = he.decode(sanitizeHtml(sourceItem.title || 'No title available'));
  const cleanDesc = he.decode(sanitizeHtml(sourceItem.contentSnippet || sourceItem.description || sourceItem['content:encoded'] || sourceItem.content || 'No description available', { allowedAttributes: { 'a': ['href'] } } ));
  const cleanLink = sourceItem.link || sourceItem.guid || 'No link available';

  return {
    title: cleanTitle,
    link: cleanLink,
    pubDate: sourceItem.pubDate,
    creator: sourceItem.creator || 'Unknown',
    description: cleanDesc,
    summary: he.decode(sourceItem.summary || 'No summary'),
  };
}


function sendsourceResponse(res, source) {
  console.log('source Title:', source.title);
  if (source.items && Array.isArray(source.items)) {
    source.items.forEach((sourceItem, i) => {
      const cleaned = fixSourceItem(sourceItem);
      const pubDate = cleaned.pubDate ? new Date(cleaned.pubDate).toLocaleDateString() : 'No date';
      console.log(`${i + 1}. ${cleaned.title} -> ${cleaned.link}\n Written by: ${cleaned.creator}\n Description: ${cleaned.description}\n Summary: ${cleaned.summary}\n Published: ${pubDate}\n`);
    });
  }

  // Send source data to frontend
  const sourceArticles = (source.items).map(fixSourceItem);

  res.json({
    sourceTitle: source.title,
    sourceArticles,
  });
}


const addSource = async (req, res) => {
  const sourceURL = req.body.url;
  if (!sourceURL) {
    return res.status(400).json({ error: 'Please provide a source URL to add the source to the source' });
  }

  try {
    let source = await parser.parseURL(sourceURL);
    sendsourceResponse(res, source);
  } catch (err) {
    console.error('rss-parser failed:', err.message);
    try {
      const response = await fetch(sourceURL);
      //catch HTTP errors
      if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);

      const newsource = await response.text();
      const source = htmlparser2.parsesource(newsource, {
        recognizeCDATA: true,
        decodeEntities: true,
        recognizeSelfClosing: true,
      });
      sendsourceResponse(res, source);
    } catch (err) {
      console.error('htmlparser2 fallback failed:', err.message);
      res.status(500).json({ error: 'Failed to fetch and parse the source. Please try a different source URL' });
    }
  }
};


module.exports = { homePage, addSource };