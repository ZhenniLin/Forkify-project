import { async } from 'regenerator-runtime';
import { API_URL, RES_PER_PAGE, KEY } from './config';
import { AJAX } from './helpers';

// 定义了一个‘state’的对象，包含recipe / search
export const state = {
  //  一个空对象，用于存储加载的食谱信息。这里暂时为空
  //  等待在后续调用 loadRecipe 函数时填充数据
  recipe: {},
  //  一个包含搜索相关信息的对象
  search: {
    query: '', //用于存储用户的搜索查询内容
    results: [], // 用于存储搜索结果的数组，暂时为空数组
    page: 1, // 当前显示的搜索结果页码，默认为1
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;

  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    soureUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

// export loadRecipe
// 定义一个异步函数loadRecipe
// 用于加载食谱数据并将其保存在state.recipe
export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);

    state.recipe = createRecipeObject(data);

    // 获取从API返回的数据对象中的 data 属性
    // 并从中解构出 recipe 对象

    if (state.bookmarks.some(bookmark => bookmark.id === id)) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }

    console.log(state.recipe);
  } catch (err) {
    // temp error
    console.error('${err} 💥💥💥💥💥💥');
    throw err;
  }
};

//  这段代码用于根据用户输入的搜索查询从API获取相关的食谱搜索结果，并将搜索结果保存在 state.search.results 中
//  这样，其他部分的代码可以使用 state.search.results 中的数据来展示搜索结果，从而帮助用户找到所需的食谱
export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    state.search.page = 1;
  } catch (err) {
    console.error(`${err} 💥💥💥💥`);
    throw err;
  }
};

// 这段代码用于根据指定的页码从搜索结果中获取对应的数据，并将该页的搜索结果作为函数的返回值
// 通过这个函数，我们可以轻松地获取不同页的搜索结果数据，方便在用户界面中进行分页显示和展示搜索结果
export const getsearchResultsPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
};

// 这个函数用于更新食谱的份量。
// 当用户改变食谱的份数时，这个函数会根据新的份数重新计算每个食材的数量，以便食谱可以正确地适应新的份数
export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  // newQt = oldOt * newServings / oldServings // 2 * 8 / 4 = 4

  state.recipe.servings = newServings;
};

// 这个函数用于将书签信息保存在浏览器的本地存储中。
// 每当用户添加或删除一个书签时，这个函数会将最新的书签列表以 JSON 格式存储在浏览器的本地存储中，以便在页面重新加载或关闭后仍然保留书签信息
const persistBookmarks = function () {
  // setItem 是 localStorage 提供的一个方法，它接受两个参数：第一个参数是存储的键名，这里设为 'bookmarks'，第二个参数是要存储的值，也就是转换后的 JSON 字符串
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

// 这个函数用于向食谱应用的书签列表中添加一个新的食谱。
// 当用户收藏一道食谱时，这个函数将被调用，它会将食谱添加到应用的书签列表中，并标记当前正在查看的食谱为已收藏
export const addBookmark = function (recipe) {
  // add bookmark
  state.bookmarks.push(recipe);

  // mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmarks();
};

// 这个函数用于从书签列表中删除指定的食谱。
// 当用户取消收藏一道食谱时，这个函数将被调用，它会从书签列表中找到对应的食谱并将其删除，并且如果当前正在查看的食谱是被删除的食谱，则将其标记为未收藏
export const deleteBookmark = function (id) {
  // delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  // mark current recipe as bookmark
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
};

// 这个函数在应用加载时被调用，它用于从浏览器的本地存储中恢复之前保存的书签信息。
// 如果之前有保存的书签信息，它会将这些信息加载到应用的书签列表中
const init = function () {
  // 从localStorage get item
  const storage = localStorage.getItem('bookmarks');
  // JSON.parse(storage)。JSON.parse 是一个函数，它用于将 JSON 格式的字符串转换成 JavaScript 对象。在这里，它把从本地存储取出的 JSON 字符串转换成了 JavaScript 对象，并将结果赋值给应用的书签列表 state.bookmarks。这样，应用就恢复了之前保存的书签信息
  if (storage) state.bookmarks = JSON.parse(storage);
};

init();

//  这个函数用于清除浏览器的本地存储中保存的所有书签信息。
// 当用户想要重置应用的书签列表时，可以调用这个函数来清除所有保存的书签信息
const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};

// clearBookmarks();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format :)'
          );

        const [quantity, unit, description] = ingArr;

        return { quantity: quantity ? +quantity : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    console.log(recipe);

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
