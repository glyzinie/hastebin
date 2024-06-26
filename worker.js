/* eslint-disable no-useless-escape */
const github = { // DO NOT CHANGE THIS!
  main: "glyzinie/hastebin",
  branch: "main",
  css: {
    application: "application"
  },
  js: {
    application: "application"
  }
}

const options = { // YOU CAN CHANGE THIS!
  expireTTL: 1209600, // In Seconds, 1209600 (2 Weeks)
  name: "Hastebin", // The name that shows at the top of the tab
  icon: `https://raw.githubusercontent.com/${github.main}/main/img/haste.png`, // The icon that shows at the top of the tab.
  siteData: {
    name: `Selfhosted Hastebin`, // The site_name for the oembed
    title: `View Haste`, // The title for the oembed.
    description: `A cloudflare workers hastebin service, https://github.com/elara-bots/hastebin`, // The description for the oembed.
    url: `https://github.com/elara-bots/hastebin`, // The website url for the oembed.
    color: "#00ffe9", // The hex color code for the oembed.
    image: `https://raw.githubusercontent.com/${github.main}/main/img/haste.png`, // The thumbnail to use for the oembed.
  },
}

const css = (name) => `https://cdn.jsdelivr.net/gh/${github.main}@${github.branch}/css/${name}.css`;
const js = (name) => `https://cdn.jsdelivr.net/gh/${github.main}@${github.branch}/js/${name}.min.js`;
const responders = {
  success: (data) => responders.json({ status: true, ...data }),
  error: (message = "") => responders.json({ status: false, message }),
  json: (obj) => new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } }),
  html: (str) => new Response(str, { headers: { "content-type": "text/html" } })
};

function generate(length = 10, options = {}) {
  let upperLetters = options?.upperLetters ?? true;
  let lowerLetters = options?.lowerLetters ?? true;
  let numbers = options?.numbers ?? true;
  let symbols = options?.symbols ?? false;

  if (!length || length <= 0) {
    length = 10;
  }
  if (!upperLetters && !lowerLetters && !numbers && !symbols) {
    upperLetters = true;
    lowerLetters = true;
    numbers = false;
    symbols = false;
  }

  let charatters = "";

  if (upperLetters) {
    charatters += "ABCDEFGHIJKLMNOPQRSTUWXYZ";
  }
  if (lowerLetters) {
    charatters += "abcdefghijklmnpqrstuwxyz";
  }
  if (numbers) {
    charatters += "1234567890";
  }
  if (symbols) {
    charatters += "!@#$%^&*.()";
  }

  let code = "";

  for (let i = 0; i < length; i++) {
    code += charatters.charAt(Math.floor(Math.random() * charatters.length));
  }

  return code;
}

function createObj(content) {
  const date = new Date();
  return {
    "key": generate(20, { upperLetters: false, numbers: true, lowerLetters: false, symbols: false }),
    "created": date.toISOString(),
    "expire": new Date(date.getTime() + (options.expireTTL * 1000)).toISOString(),
    "title": options.name,
    "data": content,
  }
}

async function fetchBin(env, id) {
  if (!env.HASTES) {
    return { status: false, message: `The developer hasn't set the 'HASTES' KVnamespace` };
  }
  const data = await env.HASTES.get(`docs:${id}`).catch(() => null);
  if (!data) {
    return {
      status: false,
      message: `Unable to find (${id}) haste.`
    }
  }
  let json = null;
  try {
    json = JSON.parse(data);
  } catch {
    return null;
  }
  return {
    status: true,
    ...json
  };
}
async function createBin(env, content) {
  if (!env.HASTES) {
    return { status: false, message: `The developer hasn't set the 'HASTES' KVnamespace` };
  }
  const data = createObj(content);
  await env.HASTES.put(`docs:${data.key}`, JSON.stringify(data), { expirationTtl: options.expireTTL });
  return { status: true, ...data };
}

const generateHTML = () => {
  return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
        <meta name="robots" content="noindex,nofollow">
        <title>${options.name}</title>

        <link rel="icon" href="${options.icon}">
        <meta name="theme-color" content="${options.siteData.color}">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="${options.siteData.name}">
        <meta property="og:title" content="${options.siteData.title}">
        <meta property="og:description" content="${options.siteData.description}">
        <meta property="og:image" content="${options.siteData.image}">
        <meta property="og:url" content="${options.siteData.url}">

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/default.min.css">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">
        <link rel="stylesheet" href="${css(github.css.application)}">

        <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"><\/script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"><\/script>
        <script src="${js(github.js.application)}"><\/script>

        <script>
            var app = null;

            // Handle URL changes
            function handlePopStateEvent(event) {
                var path = event.target.location.pathname;
                if (path === '/') {
                    app.newDocument(true);
                } else {
                    app.loadDocument(path.substring(1));
                }
            }

            // Initialize the app and set up event handlers
            document.addEventListener('DOMContentLoaded', () => {
                app = new haste('hastebin');
                handlePopStateEvent({ target: window });

                // Use the popstate event to handle URL changes, improve setup to handle browser inconsistencies
                window.addEventListener('popstate', handlePopStateEvent);
            });
        <\/script>
    </head>
    <body>
        <ul id="messages"></ul>

        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
            <div style="display: flex; flex: auto;">
                <div id="linenos"></div>
                <pre id="box" style="display:none; flex: auto;" class="hljs" tabindex="0"><code></code></pre>
                <textarea spellcheck="false" style="display:none;"></textarea>
            </div>

            <div id="key" class="menu" style="display: flex; padding: 16px;">
                <div class="logo" style="flex: auto; display: flex; align-items: center;">
                    <div class="button-wrap" style="position: relative;">
                        <span class="label label--small">About</span>
                        <a style="display: flex">
                            <svg width="75" height="15" viewBox="0 0 75 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4.11643 8.40057C4.12283 7.28196 4.7876 6.61719 5.77837 6.61719C6.78192 6.61719 7.36359 7.26278 7.3572 8.35582V14H10.4829V7.74219C10.4893 5.51776 9.13419 4.05398 7.06956 4.05398C5.59939 4.05398 4.56388 4.77628 4.12283 5.98438H4.01416V0.909091H0.990723V14H4.11643V8.40057Z"
                                    fill="#73848C" />
                                <path
                                    d="M15.2018 14.1662C16.5697 14.1662 17.5158 13.6357 18.0527 12.6321H18.1294V14H21.0697V7.3267C21.0697 5.24929 19.2224 4.05398 16.7231 4.05398C14.0832 4.05398 12.5875 5.38352 12.3382 7.1733L15.221 7.27557C15.3552 6.64915 15.873 6.26562 16.6976 6.26562C17.4646 6.26562 17.9504 6.63636 17.9504 7.29474V7.3267C17.9504 7.92756 17.2984 8.0554 15.6237 8.20241C13.6358 8.36861 11.9739 9.10369 11.9739 11.277C11.9739 13.2202 13.3226 14.1662 15.2018 14.1662ZM16.167 12.1207C15.4447 12.1207 14.9334 11.7756 14.9334 11.1236C14.9334 10.4908 15.432 10.1072 16.3204 9.97301C16.9021 9.88991 17.618 9.76207 17.9696 9.5767V10.5099C17.9696 11.4687 17.1642 12.1207 16.167 12.1207Z"
                                    fill="#73848C" />
                                <path
                                    d="M31.5527 7.17969C31.3865 5.23651 29.7949 4.05398 27.1358 4.05398C24.4767 4.05398 22.7828 5.21094 22.7956 7.17969C22.7828 8.68821 23.748 9.6598 25.7104 10.0241L27.4234 10.3501C28.2352 10.5099 28.606 10.7656 28.6187 11.2003C28.606 11.6925 28.0562 12.0185 27.2572 12.0185C26.3687 12.0185 25.7679 11.6349 25.6337 10.919L22.5463 10.9957C22.77 12.9389 24.4383 14.1854 27.2445 14.1854C29.8716 14.1854 31.7828 12.875 31.7956 10.8551C31.7828 9.42329 30.8368 8.57315 28.8808 8.19602L26.9888 7.83807C26.1578 7.67188 25.8893 7.37784 25.8957 7.00071C25.8893 6.50213 26.471 6.19531 27.1933 6.19531C28.0179 6.19531 28.5932 6.63636 28.6827 7.25639L31.5527 7.17969Z"
                                    fill="#73848C" />
                                <path
                                    d="M38.8764 4.18182H37.1058V1.82955H33.9801V4.18182H32.6825V6.48295H33.9801V11.2578C33.9609 13.2457 35.2521 14.2429 37.4573 14.1406C38.2116 14.1023 38.7549 13.9489 39.0554 13.8594L38.5823 11.603C38.4481 11.6349 38.1349 11.6989 37.8984 11.6989C37.3934 11.6989 37.1058 11.4943 37.1058 10.9126V6.48295H38.8764V4.18182Z"
                                    fill="#73848C" />
                                <path
                                    d="M44.9552 14.1854C47.5312 14.1854 49.2251 12.9389 49.583 11.0085L46.713 10.9254C46.4701 11.5774 45.8309 11.929 45.0127 11.929C43.811 11.929 43.0696 11.13 43.0696 9.92827V9.84517H49.615V9.06534C49.615 5.83097 47.6463 4.05398 44.8593 4.05398C41.8934 4.05398 39.9886 6.08665 39.9886 9.12926C39.9886 12.2741 41.8679 14.1854 44.9552 14.1854ZM43.0696 8.02983C43.1143 7.05185 43.8877 6.31037 44.9232 6.31037C45.9524 6.31037 46.6938 7.02628 46.7066 8.02983H43.0696Z"
                                    fill="#73848C" />
                                <path
                                    d="M51.8059 14H53.2633V12.4915H53.4422C53.7746 13.0284 54.4138 14.2045 56.3059 14.2045C58.7604 14.2045 60.4735 12.2358 60.4735 9.11648C60.4735 6.02273 58.7604 4.05398 56.2803 4.05398C54.3627 4.05398 53.7746 5.23011 53.4422 5.74148H53.3144V0.909091H51.8059V14ZM53.2888 9.09091C53.2888 6.89205 54.2604 5.40909 56.1013 5.40909C58.019 5.40909 58.965 7.01989 58.965 9.09091C58.965 11.1875 57.9934 12.8494 56.1013 12.8494C54.286 12.8494 53.2888 11.3153 53.2888 9.09091Z"
                                    fill="#73848C" />
                                <path
                                    d="M62.781 14H64.2896V4.18182H62.781V14ZM63.5481 2.54545C64.1361 2.54545 64.6219 2.08523 64.6219 1.52273C64.6219 0.960227 64.1361 0.5 63.5481 0.5C62.96 0.5 62.4742 0.960227 62.4742 1.52273C62.4742 2.08523 62.96 2.54545 63.5481 2.54545Z"
                                    fill="#73848C" />
                                <path
                                    d="M68.561 8.09375C68.561 6.38068 69.6221 5.40909 71.0667 5.40909C72.4666 5.40909 73.3167 6.32315 73.3167 7.86364V14H74.8252V7.76136C74.8252 5.25568 73.4893 4.05398 71.5014 4.05398C70.0184 4.05398 69.098 4.71875 68.6377 5.71591H68.5099V4.18182H67.0525V14H68.561V8.09375Z"
                                    fill="#73848C" />
                            </svg>
                        </a>
                    </div>
                </div>
                <div id="box2" class="menu-actions">
                    <div class="button-wrap" style="position: relative;">
                        <span class="label label--small">ctrl + s</span>
                        <button class="save button-picture function">Save</button>
                    </div>
                    <div class="button-wrap" style="position: relative;">
                        <span class="label label--small">ctrl + n</span>
                        <button class="new button-picture function">New</button>
                    </div>
                    <div class="button-wrap" style="position: relative;">
                        <span class="label label--small">ctrl + d</span>
                        <button class="duplicate button-picture function">Duplicate & Edit</button>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};

const getDoc = async (request, env) => {
  const url = new URL(request.url);
  if (url.pathname.includes("/documents/")) {
    const [, id] = url.pathname.split("/documents/");
    const r = await fetchBin(env, id.split(".")[0]);
    if (!r) {
      return responders.error(`I was unable to fetch the haste contents`);
    }
    if (typeof r === "object" && r.status === false) {
      return responders.json(r);
    }
    return responders.json({ status: true, ...r });
  }
  return responders.html(generateHTML());
};
const postDoc = async (request, env) => {
  if (env.HASTE_KEYS && env.HASTE_KEYS.length) {
    const keys = env.HASTE_KEYS.split(", ");
    if (!keys.length) {
      return responders.error(`The site owner hasn't set the HASTE_KEYS`);
    }
    const key = request.headers.get('authorization');
    if (!keys.includes(key)) {
      return responders.error(`Unauthorized.`);
    }
  }
  const content = await request.text();
  if (!content) {
    return responders.error(`You failed to provide any content.`);
  }
  const r = await createBin(env, content);
  if (!r) {
    return responders.error(`I was unable to create the haste.`);
  }
  // @ts-ignore
  return responders.json({ status: true, ...r });
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return getDoc(request, env);
    } else if (request.method === "POST") {
      return postDoc(request, env);
    }
    return new Response(`Hello World from ${request.method}!`);
  }
}
