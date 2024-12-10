import Resolver from '@forge/resolver';
import api, { route, fetch } from '@forge/api'; // Replace invokeRemote with fetch
const resolver = new Resolver();

resolver.define('fetchLabels', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}?fields=labels`);

  const data = await res.json();

  const label = data.fields.labels;
  if (label == undefined) {
    console.warn(`${key}: Failed to find labels`);
    return [];
  }

  return label;
});

resolver.define('fetchProperties', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}/properties`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  console.log(`Response: ${res.status} ${res.statusText}`);
  const data = await res.json();

  if (!data.keys) {
    console.warn(`${key}: Failed to find properties`);
    return {};
  }

  return data.keys;
});

resolver.define('fetchIssueData', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  console.log(`Response: ${res.status} ${res.statusText}`);
  const data = await res.json();

  if (!data) {
    console.warn(`${key}: Failed to find issue data`);
    return {};
  }

  return data;
});

resolver.define('sendTextSummary', async (req) => {
  const { textSummary } = req.payload;

  try {
    const res = await fetch('https://single-cab-444122-f7.uc.r.appspot.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputText: textSummary }),
    });

    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status}`);
    }

    const responseData = await res.json();
    console.log('Completeness:', responseData.completeness);
    console.log('Recommendations:', responseData.recommendations);
    return {
      completeness: responseData.completeness,
      recommendations: responseData.recommendations,
    };
  } catch (error) {
    console.error('Failed to send text summary', error);
    return { completeness: null, recommendations: [] };
  }
});

export const handler = resolver.getDefinitions();
