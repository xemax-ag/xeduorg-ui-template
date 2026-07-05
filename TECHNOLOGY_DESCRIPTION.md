# How does a website work?

A website is not a single thing, but a combination of several technologies that each have a clear role. The browser,
such as Chrome, Edge, Firefox, or Safari, receives files from a server and turns them into the page that the user sees.
Some of these files describe the content and structure of the page, some define how it looks, and others control how it
behaves when the user interacts with it. A simple website can be compared to a printed document: it has text, headings,
images, and links. A modern web application goes further. It can react when a button is clicked, load new information,
save changes, show messages, or update only one part of the screen without reloading the whole page. In this project,
the main browser technologies are HTML for structure, JavaScript for behavior, Preact for organizing the interface, and
Tailwind CSS and daisyUI for appearance and reusable interface elements.

# Technology Stack Used in This Project

The technology stack used in this project is deliberately simple and browser-focused. HTML defines the structure of the
pages, while JavaScript controls behavior and user interaction. Preact organizes the interface into reusable components
without requiring a heavy setup, and Tailwind CSS provides a consistent way to style layout, spacing, colors, and
responsive behavior. daisyUI adds ready-made Tailwind-based interface classes where standard controls are useful. Python is used
outside the browser for supporting tools, such as the local web server, documentation generation, OpenAPI model
generation, translation synchronization, and upload scripts. Together, these technologies keep the project
understandable, practical, and easy to run locally.

## HTML (https://developer.mozilla.org/en-US/docs/Web/HTML)

- **HTML** stands for **HyperText Markup Language**. It describes the structure of a web page.
- HTML tells the browser what should be shown: headings, paragraphs, buttons, links, images, forms, tables, and other
  visible parts of the page.
- HTML is called a **markup language** because it marks parts of a document with meaning, for example "this is a
  heading" or "this is a button".
- HTML does not contain the main program logic of the application. By itself, it does not decide what should happen when
  a user clicks a button or changes data.
- A page made only with HTML is mostly **static**. It can show information, but it cannot easily react, calculate,
  fetch new data, or update parts of the screen without help from another technology.

## JavaScript (https://developer.mozilla.org/en-US/docs/Web/JavaScript)

- **JavaScript** is the programming language that runs inside the web browser.
- It controls the logic of a website. For example, JavaScript can react to button clicks, open dialogs, validate input,
  load data from a server, and update what the user sees.
- JavaScript brings static websites to life. It turns a page from a fixed document into an interactive application.
- In this project, JavaScript runs directly in the browser. This keeps the setup simple because the browser already
  knows how to execute it.
- One challenge with JavaScript is **dynamic typing**. This means that the type of a value, such as text, a number, or a
  list, is checked while the program runs. This gives flexibility, but it can also allow some mistakes to appear only
  when the user opens or uses a specific part of the application.
- **TypeScript** is a popular alternative that adds stronger type checking to JavaScript. It can catch many mistakes
  earlier, before the application runs.
- For this project, a conscious decision was made to use plain JavaScript instead of TypeScript. The main reason is
  installation simplicity: the application can run without installing Node.js or adding a separate build step.

# Preact (https://preactjs.com/)

- **Preact** is a small library for building user interfaces in the browser.
- It is based on the same general ideas and syntax style as React, a very widely used user interface library.
- Preact helps split the screen into reusable pieces called **components**. A component can be something small, such as a
  button, or something larger, such as a complete project list.
- This project uses **htm**, a template syntax inspired by JSX. It allows the code to describe the visible HTML-like
  structure directly inside JavaScript.
- htm makes it convenient to insert variables into the displayed page. For example, a project name stored in JavaScript
  can be placed directly into the HTML-like template that the user sees.
- Preact is useful here because it keeps the interface reactive: when data changes, Preact updates the relevant part of
  the screen instead of forcing the whole page to be rebuilt manually.

State management means remembering information while the application is running. Examples are the currently selected
project, whether a dialog is open, or which data has already been loaded.

- **`useState`** is best for local state. It belongs to one component and is usually used when only that component, or
  its direct child components, need the information.
- **Signals** are better for shared or global state. A signal can be read by different parts of the application, and
  every part that depends on it can update when the signal changes.
- In simple terms, `useState` is useful for information that belongs to one screen area, while signals are useful for
  information that many screen areas need to share.
- Local state keeps components independent. Global state makes shared information easier to access, but it should be
  used carefully so the application stays understandable.

# Tailwind CSS (https://tailwindcss.com)

- **Tailwind CSS** is used to describe the appearance of a website.
- It controls visual details such as spacing, colors, text size, borders, shadows, layout, and responsive behavior on
  different screen sizes.
- Instead of writing many separate CSS rules with custom names, Tailwind provides small utility classes. Each class does
  one clear visual job, for example adding padding, changing a text color, or creating a grid layout.
- Tailwind CSS is a common choice for modern websites because it makes visual changes fast and consistent. Developers
  can style elements directly where the structure is written, which reduces switching between files.
- It also helps teams keep a consistent design system. Colors, spacing, sizes, and breakpoints can be defined once and
  reused across the interface.
- In this project, Tailwind is a practical choice because it supports a modern-looking interface without requiring a
  complex build setup.

# daisyUI (https://daisyui.com)

- **daisyUI** is a free and open source component library for Tailwind CSS.
- A **component library** is a collection of ready-made interface elements, such as buttons, dialogs, menus, tabs,
  dropdowns, form fields, and notifications.
- Component libraries save time because common interface parts do not need to be built from scratch.
- They also help create a more consistent user experience. If buttons, menus, and dialogs come from the same library,
  they usually behave and look more predictable.
- daisyUI works by adding semantic class names to Tailwind CSS. Instead of writing many utility classes for every
  button, card, alert, or toggle, developers can use classes such as `btn`, `card`, `alert`, or `toggle`.
- daisyUI is CSS-based and framework-independent. The same classes can be used in plain HTML, Preact, React, Vue, and
  many other environments because the browser only needs the generated CSS.

There are a few integration details to keep in mind when using daisyUI together with Tailwind CSS:

- daisyUI is not a replacement for Tailwind CSS. Tailwind still provides the low-level utility classes for spacing,
  layout, typography, and detailed adjustments.
- daisyUI component classes provide a higher-level starting point. Tailwind utility classes can still be added when a
  component needs project-specific changes.
- daisyUI includes a theme system with semantic color names such as `primary`, `secondary`, `success`, `warning`, and
  `error`. This makes light mode, dark mode, and custom themes easier to manage consistently.
- Tailwind includes a small browser reset called **Preflight**. It normalizes default browser styles, which is usually
  helpful, but it can sometimes affect form elements or surrounding content in unexpected ways.
- Both tools can be used together successfully, but the styling approach should be clear: use Tailwind for the general
  page layout and project-specific styling, and use daisyUI classes for common reusable interface elements.

# Python (https://www.python.org)

- **Python** is a popular programming language because it is comparatively easy to read and write.
- Its syntax is close to normal language, which makes it approachable for beginners and efficient for experienced
  developers.
- Python has a very large ecosystem of libraries. This means many common tasks, such as working with files, web
  requests, documents, data, tests, and automation, can be handled with existing tools.
- Many AI and data tools are based on Python. It is widely used for machine learning, data analysis, automation, and
  connecting different systems.
- In this project, Python is the basis for the **`core/`** module.
- The `core/` module contains supporting tools around the web application, for example the local web server,
  upload scripts, OpenAPI model generation, Markdown-to-HTML documentation generation, and translation synchronization.
- This separation is useful: the browser application is built with HTML, JavaScript, Preact, and Tailwind, while Python
  handles the background tooling that helps develop, document, and publish the project.
