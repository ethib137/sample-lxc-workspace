# Sample LXC Workspace & Client Extensions Quick Start Guide
Follow the steps in this readme to build a sample lxc workspace and build a client extension using React. This repo also contains the completed code from following the steps below along with the git commit history to show the step by step process.
1. If you haven't already, [install Blade CLI](https://learn.liferay.com/dxp/latest/en/building-applications/tooling/blade-cli/installing-and-updating-blade-cli.html).
1. Update Blade to the latest snapshot by running:
	- `$ blade update -s`.
	- You can check that you're on the latest version by running `$ blade version` . While creating this guide I'm on `blade version 4.1.0.SNAPSHOT202207161538`
1. To create an LXC workspace run `$ blade init sample-lxc-workspace`.
	- You will be prompted to select the "Liferay product to target". Select the latest one.
1. `$ cd sample-lxc-workspace`
1. `$ mkdir client-extensions`
This should result in the following structure:
```
➜  sample-lxc-workspace tree
.
├── Dockerfile.ext
├── GETTING_STARTED.markdown
├── build.gradle
├── client-extensions
│   └── ...
├── configs
│   └── ...
├── gradle
│   └── ...
├── gradle-local.properties
├── gradle.properties
├── gradlew
├── gradlew.bat
├── modules
├── platform.bndrun
├── settings.gradle
└── themes
```
## Creating a Custom Element Client Extension
1. `$ cd client-extensions`
1. Create a new Custom Element Client Extension by running `$ blade create -t client-extension sample-custom-element`
	- Select the `customElement`  extension type.
	- Type `Sample Custom Element` for the name.
1. `$ cd sample-custom-element`
```
➜  sample-custom-element tree
.
├── client-extension.yaml
└── src
    ├── index.js
    └── style.css

// client-extension.yaml
sample-custom-element:
    cssURLs:
        - style.css
    friendlyURLMapping: vanilla-counter
    htmlElementName: vanilla-counter
    instanceable: false
    name: Sample Custom Element
    portletCategoryName: category.remote-apps
    type: customElement
    urls:
        - index.js
    useESM: false
```
1. Set your `liferay.workspace.home.dir` in your `gradle-local.properties`.
```
liferay.workspace.home.dir=/path/to/liferay/home
```
1. From the `sample-custom-element` directory run `$ blade gw deploy` to deploy your module to your running Liferay instance.
1. In the browser, navigate to your Liferay instance, edit the page and add the `Sample Custom Element` widget to the page.
You have now built and deployed a Custom Element Client Extension.
## Adding React
Now that you have a working Client Extension you likely want to add a JavaScript Library that will let you build something more exciting. In this guide we will use React.
In Liferay you have 2 main options for creating a custom element using React:
- [Liferay CLI Tool](https://learn.liferay.com/dxp/latest/en/building-applications/tooling/other-tools/liferay-cli-tool.html)
- [create_remote_app.sh](https://github.com/liferay/liferay-portal/blob/master/tools/create_remote_app.sh.README.markdown)
The main differences between these 2 is that `create_remote_app.sh` uses Create React App where as the `Liferay CLI Tool` does not and has a special feature to let you use the version of React running in your instance of Liferay instead of bundling it's own. Not including React can do quite a bit to reduce the size of your compiled JS.
For this guide we will use the `Liferay CLI Tool`.
1. If you haven't already install/update the [Liferay CLI Tool](https://learn.liferay.com/dxp/latest/en/building-applications/tooling/other-tools/liferay-cli-tool.html).
1. In the `sample-custom-element` directory run `$ liferay new react-custom-element` to create a custom element.
1. Select `Liferay Remote App Project` from the list.
1. Enter the project description.
1. Select `Liferay DXP 7.4` as your target platform in order to be able to share Liferay's version of React and other packages.
1. Type enter to select `React` as your project type.
1. Type `sample-custom-element` as your custom element's HTML tag name.
1. Type enter to disable using shadow dom. (This will let the theme css also style your custom element.)
Your directories should now look like this:
```
➜  sample-custom-element tree
.
├── build
│   └── ...
├── client-extension.yaml
├── dist
│   └── ...
├── react-custom-element
│   ├── README.md
│   ├── assets
│   │   └── css
│   │       └── styles.scss
│   ├── liferay.json
│   ├── package.json
│   └── src
│       ├── AppComponent.js
│       └── index.js
└── src
    ├── index.js
    └── style.css
```
1. Run `$ cd react-custom-element`.
1. Run `$ yarn && yarn build` to install dependencies and build your React custom element.
```
➜  react-custom-element tree
├── build
│   ├── css
│   │   └── styles.css
│   ├── index.js
│   └── manifest.json
```
1. Copy the `react-custom-element/build/css/styles.css` and `react-custom-element/build/index.js` to the `sample-custom-element/src` folder.
1. Update the `client-extension.yaml` file.
```
sample-custom-element:
    cssURLs:
        - styles.css
    friendlyURLMapping: sample-custom-element
    htmlElementName: sample-custom-element # Must match the html element name in index.js.
    instanceable: false
    name: Sample Custom Element
    portletCategoryName: category.remote-apps
    type: customElement
    urls:
        - index.js
    useESM: true # Must be set to true in order to use Liferay's version of React.
```
1. Deploy your client extensions by running: `$ blade gw deploy` from the `sample-custom-element` directory.
1. In order for Liferay to be able to provide a version of React for your custom element to use, you must enable Import Maps via Liferay Portal’s *Control Panel → Configuration → System Settings → Infrastructure → JavaScript Import Maps*.
Now that you've enabled Import Maps and deployed your custom element remote app, you can see it's deployed by checking Liferay Portal’s *Applications → Custom Apps → Remote Apps*. You can also add the widget to a page.

## Simplifying the Deployment Process
We have successfully built and deployed a React Custom Element Remote App Client Extension, but the deployment process was not very smooth. We had to build the React app, manually copy files, and then deploy our client extension. We can use gradle to automate this process.

1. Add the following to `sample-lxc-workspace/build.gradle`:
```
allprojects {
	plugins.withId("com.liferay.node") {
		node.global = true
		node.npmVersion = '8.1.2'
		node.nodeVersion = "16.15.1"
		node.useNpm = false
		node.yarnVersion = "1.22.5"
	}
}
```
1. Add the following to `sample-lxc-workspace/client-extensions/sample-custom-element/build.gradle`:
```
import com.liferay.gradle.util.OSDetector
import com.liferay.gradle.util.StringUtil

apply plugin: "com.liferay.node"

task buildExtraRemoteApp

File remoteAppDir = new File(projectDir, "react-custom-element")

File remoteAppCSSDir = new File(remoteAppDir, "build/css")
File remoteAppJSDir = new File(remoteAppDir, "build")

task copyfiles(type: Copy) {
	println "Copying Files"

	dependsOn buildExtraRemoteApp

	from(remoteAppCSSDir) {
		include "*.css"
	}

	from(remoteAppJSDir) {
		include "*.js"
	}

	includeEmptyDirs = false

	into file("src")

	rename(/([0-9a-zA-Z-]+).*\.(css|js)$/, '$1.$2')
}

_createExtraTasks([remoteAppDir])

private String _camelCase(String dirName) {
	String suffix = dirName.replaceAll(/\-(\w)/) {
		String s = it[1]

		s.toUpperCase()
	}

	return StringUtil.capitalize(suffix)
}

private void _createExtraTasks(List<File> dirs) {
	dirs.each {
		File dir ->

		File packageJSONFile = new File(dir, "package.json")

		if (!packageJSONFile.exists()) {
			return
		}

		println "Adding install task for " + packageJSONFile

		Task yarnInstallTask = tasks.create(name: "yarnInstall" + _camelCase(dir.name), type: Exec) {
			println 'Running Yarn Install'

			if (OSDetector.windows) {
				executable "cmd.exe"

				args "/c"
				args new File(node.nodeDir, "node.exe")
				args new File(node.nodeDir, "node_modules/yarn/yarn-" + node.yarnVersion + ".js")
			}
			else {
				executable new File(node.nodeDir, "bin/node")

				args new File(node.nodeDir, "lib/node_modules/yarn/yarn-" + node.yarnVersion + ".js")
			}

			args "install"
			dependsOn downloadNode
			workingDir dir
		}

		println "Adding build task for " + packageJSONFile

		Task yarnBuildTask = tasks.create(name: "yarnBuild" + _camelCase(dir.name), type: Exec) {
			println 'Running Yarn Build'

			if (OSDetector.windows) {
				executable "cmd.exe"

				args "/c"
				args new File(node.nodeDir, "node.exe")
				args new File(node.nodeDir, "node_modules/yarn/yarn-" + node.yarnVersion + ".js")
			}
			else {
				executable new File(node.nodeDir, "bin/node")

				args new File(node.nodeDir, "lib/node_modules/yarn/yarn-" + node.yarnVersion + ".js")
			}

			args "build"
			dependsOn yarnInstallTask
			workingDir dir
		}

		buildExtraRemoteApp.dependsOn yarnBuildTask
	}
}

build.dependsOn copyfiles
```
These build scripts will allow the `build` gradle task to:
 - Install npm modules.
 - Build the React project.
 - Copy the built files to the correct directory.
This script is written so that building the React project and copying over the files will only be done when `$ blade gw build` is run, NOT when `$ blade gw deploy`.
1. You can now build and deploy your Client Extension by running `$ blade gw build deploy`.
## Speeding up Development
Adding a gradle build script to handle the building of our React project is great for CI/CD, but for local development this takes too long. When developing locally we can run our project using the dev server that was included by Liferay CLI when we initialized our project and then point our `client-extension.yaml`  file at the resources that are hosted by that server. This will let us make changes to our a React app and automatically see them updated in Liferay without needing to constantly redeploy.
1. From the `/sample-lxc-workspace/client-extensions/sample-custom-element/react-custom-element` directory run `$ yarn start` to start the dev server.
1. Update your  `client-extension.yaml` to point to css and js resources being served by the dev server.
```
sample-custom-element:
    cssURLs:
        - http://localhost:8081/css/styles.css
    friendlyURLMapping: sample-custom-element
    htmlElementName: sample-custom-element
    instanceable: false
    name: Sample Custom Element
    portletCategoryName: category.remote-apps
    type: customElement
    urls:
        - http://localhost:8081/index.js
    useESM: true
```
1. Save and run `$ blade gw deploy` from the `/sample-lxc-workspace/client-extensions/sample-custom-element` directory.
You can now make any changes you want to your React app and automatically see the result in Liferay without needing to refresh the page.
When you're done with development don't forget to undo the changes you made to `client-extension.yaml` and to run the gradle build command before trying to deploy it locally or to the cloud.