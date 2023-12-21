const moment = require("moment");

const makeOptions = (options) => {
  return {
    hyperlinks: options.hyperlinks || false,
    sort: options.sort || "asc",
    only: options.only || null,
    limit: options.limit || null,
    noStyles: options.noStyles || false,
    prefix: options.prefix ? `${options.prefix}-epg` : "epg",
    noLabels: options.noLabels || false,

    selectorLight: options.selectorLight || ":root",
    selectorDark: options.selectorDark || null,

    boxColor: options.boxColor || null,
    highlightColor: options.highlightColor || null,
    textColor: options.textColor || null,

    boxColorLight: options.boxColorLight || "#e9ecef",
    highlightColorLight: options.highlightColorLight || "#69db7c",
    textColorLight: options.textColorLight || "#000",

    boxColorDark: options.boxColorDark || "#2d333b",
    highlightColorDark: options.highlightColorDark || "#69db7c",
    textColorDark: options.textColorDark || "#fff",
  };
};

module.exports = (eleventyConfig, configOptions = {}) => {
  let options = makeOptions(configOptions);

  getYears = (years) => {
    let keys = Object.keys(years).sort();

    if (options.only && options.only.length > 0) {
      keys = keys.filter((year) => options.only.includes(parseInt(year)));
    }

    keys = options.sort === "desc" ? keys.reverse() : keys;

    if (options.limit && options.limit > 0) {
      keys = keys.slice(0, options.limit);
    }

    return keys;
  };

  eleventyConfig.addShortcode(
    "postGraph",
    (postsCollection, overrideOptions) => {
      options = makeOptions(configOptions); // reset options
      options = {
        ...options,
        ...(overrideOptions || {}),
      };

      options.prefix =
        overrideOptions && overrideOptions.prefix
          ? `${overrideOptions.prefix}-epg`
          : options.prefix;

      let postMap = {};

      if (options.data) {
        postMap = options.data;
      } else {
        postMap = {
          years: {},
          counts: {},
        };
        for (let post of postsCollection) {
          const postDate = post.data.date || post.date;
          const postYear = moment(postDate).year();
          const dateIndexKey = `${postYear}-${moment(postDate).dayOfYear()}`;
          if (!postMap.years[postYear]) {
            postMap.years[postYear] = {
              offset: moment(postDate).startOf("year").isoWeekday() - 1,
              days:
                (postYear % 4 === 0 && postYear % 100 > 0) ||
                postYear % 400 == 0
                  ? 366
                  : 365,
            };
          }
          if (!postMap.counts[dateIndexKey]) {
            postMap.counts[dateIndexKey] = 0;
          }
          postMap.counts[dateIndexKey]++;
        }
      }

      const prefix = options.prefix;

      const styleSheet = `<style>
    ${options.selectorLight} {
        --${prefix}-box: ${options.boxColor || options.boxColorLight};
        --${prefix}-box-highlight: ${
        options.highlightColor || options.highlightColorLight
      };
        --${prefix}-text: ${options.textColor || options.textColorLight};
    }

    ${
      options.selectorDark
        ? `${options.selectorDark} {`
        : "@media (prefers-color-scheme: dark) { :root {"
    }
    --${prefix}-box: ${options.boxColor || options.boxColorDark};
    --${prefix}-box-highlight: ${
        options.highlightColor || options.highlightColorDark
      };
    --${prefix}-text: ${options.textColorDark || options.textColorDark};
    ${options.selectorDark ? "}" : "}}"}

    .${prefix} {
        color: var(--text);
        margin: 20px 0;
        font-size: 0.8em;
    }

    .${prefix}__year {
        text-align: center;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .${prefix}__months {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    @media (max-width: 410px) {
        .${prefix}__months {
            display: none;
        }
    }

    .${prefix}__squares {
        display: grid;
        grid-column-start: 2;
        grid-template-rows: repeat(7, 1fr);
        grid-auto-flow: column;
        margin-bottom: 10px;
        grid-gap: 2px;
    }

    .${prefix}__box {
        aspect-ratio: 1 / 1;
        background: var(--${prefix}-box);
    }

    .${prefix}__box--empty {
        background: none;
    }

    .${prefix}__hasPost {
        background: var(--${prefix}-box-highlight);
    }

    ${
      options.noLabels &&
      `
        .${prefix}__year, .${prefix}__months { display: none; }
    `
    }
</style>`;

      return `${options.noStyles ? "" : styleSheet}${getYears(postMap.years)
        .map((year) => {
          const linkedYear = `<a href='/${year}>${year}</a>`;
          const linkedMons = `                    <a href="/${year}/01">Jan</a>
          <a href="/${year}/02">Feb</a>
          <a href="/${year}/03">Mar</a>
          <a href="/${year}/04">Apr</a>
          <a href="/${year}/05">May</a>
          <a href="/${year}/06">Jun</a>
          <a href="/${year}/07">Jul</a>
          <a href="/${year}/08">Aug</a>
          <a href="/${year}/09">Sep</a>
          <a href="/${year}/10">Oct</a>
          <a href="/${year}/11">Nov</a>
          <a href="/${year}/12">Dec</a>`;
          const unlinkedMons = `                    <div>Jan</div>
          <div>Feb</div>
          <div>Mar</div>
          <div>Apr</div>
          <div>May</div>
          <div>Jun</div>
          <div>Jul</div>
          <div>Aug</div>
          <div>Sep</div>
          <div>Oct</div>
          <div>Nov</div>
          <div>Dec</div>`;
          return `<div class="${prefix}" style="color: var(--text);
        margin: 20px 0;">
                <div class="${prefix}__year">
                    ${options.hyperlinks ? linkedYear : year}
                </div>
                <div class="${prefix}__months">
                    ${options.hyperlinks ? linkedMons : unlinkedMons}
                </div>
                <div class="${prefix}__squares">${Array.from({
            length: postMap.years[year].offset,
          })
            .map((_, index) => {
              return `<div class="${prefix}__box ${prefix}__box--empty"></div>`;
            })
            .join("")}${Array.from({ length: postMap.years[year].days })
            .map((_, index) => {
              const dateIndexKey = `${year}-${index + 1}`;
              const postCount = postMap.counts[dateIndexKey] || 0;
              return `<div class="${prefix}__box ${
                postCount > 0 ? `${prefix}__hasPost` : ""
              }"></div>`;
            })
            .join("")}
                </div>
            </div>`;
        })
        .join("")}`;
    }
  );
};
