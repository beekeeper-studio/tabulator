This fork is based on version 6.3.1 with addition to these changes:
- fix navigation conflict with SelectRange and Edit https://github.com/olifolkerd/tabulator/pull/4516
- blur editor after pressing next/prev https://github.com/olifolkerd/tabulator/pull/4517
- fix errors when handling BigInt https://github.com/beekeeper-studio/tabulator/commit/13f9a9b99a7fb7bb8359a6f991afbd874835e2fd
- use Number.isNaN as it's more robust https://github.com/beekeeper-studio/tabulator/pull/3

<p align="center">
  <img height="200" src="http://tabulator.info/images/logos/t_hollow.png">
</p>

<p align="center">
	<img height="50" src="http://tabulator.info/images/tabulator.png">
</p>

<p align="center">
An easy to use interactive table generation JavaScript library
</p>

<p align="center">
Full documentation & demos can be found at:  <a href="http://tabulator.info">http://tabulator.info</a>
</p>

***
![Tabulator Table](http://tabulator.info/images/tabulator_table.jpg)
***


Features
================================
Tabulator allows you to create interactive tables in seconds from any HTML Table, Javascript Array or JSON formatted data.

Simply include the library and the css in your project and you're away!

Tabulator is packed with useful features including:

![Tabulator Features](http://olifolkerd.github.io/tabulator/images/featurelist_share.png)


Frontend Framework Support
================================
Tabulator is built to work with all the major front end JavaScript frameworks including React, Angular and Vue.


Setup
================================
Setting up tabulator could not be simpler.

Include the library and the css
```html
<link href="dist/css/tabulator.min.css" rel="stylesheet">
<script type="text/javascript" src="dist/js/tabulator.min.js"></script>
```

Create an element to hold the table
```html
<div id="example-table"></div>
```

Turn the element into a tabulator with some simple javascript
```js
var table = new Tabulator("#example-table", {});
```


### Bower Installation
To get Tabulator via the Bower package manager, open a terminal in your project directory and run the following command:
```
bower install tabulator --save
```

### NPM Installation
To get Tabulator via the NPM package manager, open a terminal in your project directory and run the following command:
```
npm install tabulator-tables --save
```

### CDN - UNPKG
To access Tabulator directly from the UNPKG CDN servers, include the following two lines at the start of your project, instead of the locally hosted versions:
```html
<link href="https://unpkg.com/tabulator-tables/dist/css/tabulator.min.css" rel="stylesheet">
<script type="text/javascript" src="https://unpkg.com/tabulator-tables/dist/js/tabulator.min.js"></script>
```

Testing
================================
Tabulator comes with both Unit and End-to-End (E2E) tests. Here’s how you can run them:

```bash
# Unit test
npm run test:unit

# E2E test
npm run build # Make sure to build the project first
npx playwright test # Run the tests
# or
npm run test:e2e

# Run all tests
npm run test
```

