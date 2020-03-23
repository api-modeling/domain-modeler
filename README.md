# domain-modeler

A tool to model a domain. This is a shell application to be embedded in other projects as a web comonent.

## Work in progress

This is a placeholder repository. Eventually the domain modeling part will appear here.

## Architecture

This repository represents a shell application that hosts components built for this purpose. It hosts components responsible for:
- navigating through the domain model
- browsing packages
- edit canvas
- model / package edit forms

The shell application binds the component together and builds application UI. 
What the application doesn't do is platform specific bindings. It does not provide storage or AMF model processing capabilities. This has to be provided by the final implementation of the application (web application, Electron, other integrations).

## Usage

Install the component

```sh
npm i -S @api-modeling/domain-modeler
```

### In an HTML page

```html
<html>
  <head>
    <script type="module">
      import '@api-modeling/domain-modeler/domain-modeler.js';
    </script>
  </head>
  <body>
    <domain-modeler></domain-modeler>
    <script>
    (async () => {
      const model = await getAmfModel();
      element.model = model;
      element.onchange = (e) => {
        // some basic API, subject to change.
      };
    })();
    </script>
  </body>
</html>
```

For the component to work it needs to communicate with a data store that keeps AMF model. It requests data from the store depending on user interaction. For example, when the user select a model in the navigation then the application dispatches an event that should be handled by the implementation, which then should query the data store for the model definition.

### API

To be defined.
