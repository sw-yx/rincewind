import { Command, flags } from "@oclif/command";
const { BuildError } = require("@parcel/core");
const { NodePackageManager } = require("@parcel/package-manager");
const { NodeFS } = require("@parcel/fs");
const chalk = require("chalk");
import { normalizeOptions } from "../normalizeOptions";

export default class Build extends Command {
  static description = "describe the command here";

  static examples = [`$ rincewind build # production build of a rincewind app`];

  static flags = {
    help: flags.help({ char: "h" }),
    "no-cache": flags.boolean({ default: false }),
    "no-sourceMaps": flags.boolean({ default: false }),
    "no-autoinstall": flags.boolean({ default: false }),
    "no-profile": flags.boolean({ default: false }),
    "no-minify": flags.boolean({ default: false }),
    "no-scope-hoisting": flags.boolean({ default: false })
  };

  static args = [{ name: "file" }]; // todo: support multiple entries

  async run() {
    const { args, flags } = this.parse(Build);

    let Parcel = require("@parcel/core").default;
    let packageManager = new NodePackageManager(new NodeFS());
    let defaultConfig = await packageManager.require(
      "@parcel/config-default",
      __filename
    );
    let parcel = new Parcel({
      entries: args.file,
      packageManager,
      defaultConfig: {
        ...defaultConfig,
        filePath: (
          await packageManager.resolve("@parcel/config-default", __filename)
        ).resolved
      },
      patchConsole: false,

      ...(await normalizeOptions({
        isProd: true,
        cache: !flags["no-cache"],
        minify: !flags["no-minify"],
        sourceMaps: !flags["no-sourceMaps"],
        scopeHoist: !flags["no-scope-hoisting"],
        autoinstall: !flags["no-autoinstall"],
        profile: !flags["no-profile"]
        // TODO: offer https, minify, sourceMaps etc options
      })) // todo: see what is in there we need
    });

    try {
      await parcel.run();
      console.log(`Build Done!`);
      console.log(`Either serve locally: `);
      console.log(`    ${chalk.cyan(`serve dist`)}`);
      console.log(`Or deploy to Netlify: `);
      console.log(`    ${chalk.cyan(`ntl deploy --prod`)}`);
    } catch (e) {
      // If an exception is thrown during Parcel.build, it is given to reporters in a
      // buildFailure event, and has been shown to the user.
      if (!(e instanceof BuildError)) console.error(e);
      process.exit(1);
    }
  }
}
