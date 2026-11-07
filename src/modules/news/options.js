// [value sent to the API, label shown to you]
export const COUNTRIES = [
  ['au', 'Australia'], ['br', 'Brazil'], ['ca', 'Canada'], ['cn', 'China'],
  ['de', 'Germany'], ['eg', 'Egypt'], ['es', 'Spain'], ['fr', 'France'],
  ['gb', 'United Kingdom'], ['hk', 'Hong Kong'], ['id', 'Indonesia'],
  ['in', 'India'], ['it', 'Italy'], ['jp', 'Japan'], ['kr', 'South Korea'],
  ['lk', 'Sri Lanka'], ['mx', 'Mexico'], ['my', 'Malaysia'], ['ng', 'Nigeria'],
  ['nl', 'Netherlands'], ['nz', 'New Zealand'], ['ph', 'Philippines'],
  ['pk', 'Pakistan'], ['ru', 'Russia'], ['sa', 'Saudi Arabia'], ['sg', 'Singapore'],
  ['th', 'Thailand'], ['tr', 'Turkey'], ['tw', 'Taiwan'], ['us', 'United States'],
  ['vn', 'Vietnam'], ['za', 'South Africa'],
]

export const LANGUAGES = [
  ['ar', 'Arabic'], ['zh', 'Chinese'], ['nl', 'Dutch'], ['en', 'English'],
  ['fr', 'French'], ['de', 'German'], ['hi', 'Hindi'], ['id', 'Indonesian'],
  ['it', 'Italian'], ['ja', 'Japanese'], ['ko', 'Korean'], ['ms', 'Malay'],
  ['pt', 'Portuguese'], ['ru', 'Russian'], ['es', 'Spanish'], ['ta', 'Tamil'],
  ['th', 'Thai'], ['tr', 'Turkish'], ['vi', 'Vietnamese'],
]

export const CATEGORIES = [
  'business', 'crime', 'domestic', 'education', 'entertainment', 'environment',
  'food', 'health', 'lifestyle', 'other', 'politics', 'science', 'sports',
  'technology', 'top', 'tourism', 'world',
].map((c) => [c, c[0].toUpperCase() + c.slice(1)])

// Probably paid-only. Add more values from newsdata's docs if you want them.
export const TAGS = [
  ['agriculture_and_farming', 'Agriculture and farming'],
  ['artificial_intelligence', 'Artificial intelligence'],
  ['awards_and_recognitions', 'Awards and recognitions'],
]

// Values listed under "datatype" in the response docs
export const DATATYPES = [
  ['news', 'News'], ['blog', 'Blog'], ['multimedia', 'Multimedia'],
  ['forum', 'Forum'], ['press release', 'Press release'], ['review', 'Review'],
  ['research', 'Research'], ['opinion', 'Opinion'], ['analysis', 'Analysis'],
  ['podcast', 'Podcast'],
]

export const TIMEZONES = [
  ['', 'Default (UTC)'],
  ['asia/singapore', 'Singapore'],
  ['asia/kuala_lumpur', 'Kuala Lumpur'],
  ['asia/tokyo', 'Tokyo'],
  ['asia/kolkata', 'India'],
  ['europe/london', 'London'],
  ['america/new_york', 'New York'],
  ['america/los_angeles', 'Los Angeles'],
  ['australia/sydney', 'Sydney'],
]

export const PRIORITIES = [
  ['', 'Any'], ['top', 'Top'], ['medium', 'Medium'], ['low', 'Low'],
]

// Which part of the article the search text is matched against.
// The value is the API parameter name. Only one can be sent per request.
export const SCOPES = [
  ['qInTitle', 'Title only'],
  ['q', 'Title, content, URL'],
  ['qInMeta', 'Meta fields'],
]

const multi = (values = [], exclude = false) => ({ values, exclude })

export const DEFAULT_FILTERS = {
  country: multi(),
  language: multi(['en']),
  category: multi(),
  tag: multi(),
  datatype: multi(),
  timezone: '',
  prioritydomain: '',
  domainurl: '',
  image: false,
  video: false,
  removeduplicate: true,
}