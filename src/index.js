import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
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

export const handler = resolver.getDefinitions();
