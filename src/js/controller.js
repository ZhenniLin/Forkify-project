// import sth
import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime';

// if (module.hot) {
//   module.hot.accept();
// }

//select some area
const recipeContainer = document.querySelector('.recipe');

///////////////////////////////////////

// controlRecipes
//这段代码实现了一个逻辑，根据页面URL中的哈希部分（id），加载特定的食谱数据，并在页面上渲染显示该食谱的内容。
//在整个过程中，如果有任何错误发生，它们将被捕获并在页面上显示
const controlRecipes = async function () {
  try {
    //从当前页面的URL中获取哈希（URL中的#后面的部分
    //然后去掉第一个字符（#）
    const id = window.location.hash.slice(1);
    //确保只有在有id（哈希）时才会继续执行下面的逻辑
    if (!id) return;

    //用于在页面上显示一个加载中的动画或图标
    //以提示用户数据正在加载中
    recipeView.renderSpinner();

    // 0 update results view to mark selected search result
    resultsView.update(model.getsearchResultsPage());

    // 1) updating bookmarks view
    bookmarksView.update(model.state.bookmarks);

    // 2) loading recipe
    await model.loadRecipe(id);

    // 3) rendering recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    recipeView.renderError();
  }
};

// controlSearchResults
// 这段代码实现了一个搜索功能，根据用户在搜索框中输入的查询，在页面上显示相关的食谱搜索结果，并提供分页按钮让用户浏览多页的搜索结果。在整个过程中，如果有任何错误发生，它们将被捕获并在控制台输出错误信息
const controlSearchResults = async function () {
  try {
    //用于在页面上显示一个加载中的动画或图标
    //提示用户数据正在加载中
    resultsView.renderSpinner();

    // 1) get search query
    //调用searchView对象的getQuery()方法，获取用户在搜索框中输入的搜索查询。这个查询将被用于搜索相关的食谱
    const query = searchView.getQuery();
    if (!query) return;

    // 2) load search results
    // 负责根据给定的查询查询相关的食谱结果。await会暂停代码的执行，直到loadSearchResults方法的Promise状态变为resolved（已完成）或rejected（发生错误）
    await model.loadSearchResults(query);

    // 3) render results
    // getsearchResultsPage(3)方法的目的是获取搜索结果中的第3页数据。然后，resultsView将使用这个数据渲染在页面上显示搜索结果
    resultsView.render(model.getsearchResultsPage());

    // 4) render initial pagination buttons
    // 一旦搜索结果页面的渲染完成，这行代码将调用paginationView对象的render方法，将当前搜索结果的分页信息传递给它，以便在页面上渲染分页按钮，使用户可以浏览不同的搜索结果页
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  // 1) render NEW results
  // resultsView.render(model.state.search.results);
  resultsView.render(model.getsearchResultsPage(goToPage));

  // 2) render NEW pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // update the recipe servings (in state)
  model.updateServings(newServings);
  // update the recipe view
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  // 1）add or remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // 2) update recipe view
  recipeView.update(model.state.recipe);

  // 3) render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // show loading spinner
    addRecipeView.renderSpinner();

    // upload the new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // render recipe
    recipeView.render(model.state.recipe);

    // success message
    addRecipeView.renderMessage();

    // render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // change ID in URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // close form window
    setTimeout(function () {
      // addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    console.error('💥', err);
    addRecipeView.renderError(err.message);
  }
};

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addhandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};

init();
