const {
  replaceCommaWithSpace,
  getMaxPageCount,
  convertToInteger,
} = require('./functions');
const AppError = require('./AppError');

class APIFeatures {
  /**
   * @param  dbModel mongoose model on using which all the features will be implemented
   * @param reqQueryObj  queryString object from incoming request
   */
  constructor(dbModel, reqQueryObj) {
    this.dbModel = dbModel;
    this.reqQueryObj = reqQueryObj;
    this.filteredQueryObj = this.filter(reqQueryObj);
    this.dbQuery = this.find();
    this.itemsPerPage = process.env.PER_PAGE_RESULT_COUNT || 15;
    this.maxPageCount = 1;
    this.currentPage = 1;
  }

  /**
   *
   * @param reqObj incoming req.query object
   * This filtered object omits parameters that are used by the API
   * but are not compatible with the syntax of mongodb filter object
   * @returns an object which has changed by removing extra parameters
   * that are not a part of filterObject required in mongoose query
   */
  filter(query) {
    const filteredQueryObj = { ...query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => {
      delete filteredQueryObj[field];
    });
    return filteredQueryObj;
  }

  find() {
    return this.dbModel.find({ ...this.filteredQueryObj });
  }

  /**
   * This methods uses the sort key-value pair in the incoming req(reqQueryObj)
   * to filter the data based on the parameters provided in reqQueryObj.sort
   * The data can be sorted based on multiple parameters
   * Mongoose's Model.find.sort() method accepts multiple parameters separated by a space
   * The query from URL provides parameters separated by a ","
   * Another helper method is used to replace all the commas with a whitespace
   */
  sort() {
    this.dbQuery = this.dbQuery.sort(
      replaceCommaWithSpace(this.reqQueryObj.sort),
    );
  }

  /**
   * This method applies .select() to the dbQueryObj and
   * modifies the query to return only those fields which are specified in the reqQueryObj.
   * This takes affect in the data returned by the query when it is executed
   */
  selectFields() {
    this.dbQuery = this.dbQuery.select(
      replaceCommaWithSpace(this.reqQueryObj.fields),
    );
  }

  async setItemsPerPage() {
    //limit is validated and is required to be a number
    //In case of an invalid value an error is thrown
    this.itemsPerPage = convertToInteger(this.reqQueryObj.limit);
    const docCount = await this.dbModel.countDocuments({
      ...this.filteredQueryObj,
    });
    /**
     * Max Pages are calculated based on the total number of docs available
     * and the limit set by user or the default limit
     */
    this.maxPageCount = getMaxPageCount(docCount, this.itemsPerPage);
    this.dbQuery = this.dbQuery.limit(this.itemsPerPage);
  }

  applyPagination() {
    let pageNumber = 1;

    // Page number is validated and is required to be an number
    pageNumber = convertToInteger(this.reqQueryObj.page);
    if (pageNumber > this.maxPageCount) {
      throw new AppError('This page does not exist', 400);
    }
    this.currentPage = pageNumber;
    // the limit variable is used to skip documents depending upon the page number provided
    this.dbQuery = this.dbQuery.skip(this.itemsPerPage * (pageNumber - 1));
  }

  async execute() {
    try {
      if (this.reqQueryObj.fields) this.selectFields();
      if (this.reqQueryObj.sort) this.sort();
      if (this.reqQueryObj.limit) await this.setItemsPerPage();
      if (this.reqQueryObj.page) this.applyPagination();
      const data = await this.dbQuery;
      return {
        currentPage: this.currentPage,
        totalPages: this.maxPageCount,
        results: data.length,
        data: data,
      };
    } catch (err) {
      throw new AppError('Something went wrong', 500);
    }
  }
}
module.exports = APIFeatures;
