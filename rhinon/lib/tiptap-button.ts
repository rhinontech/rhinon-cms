import { Node, mergeAttributes } from "@tiptap/core";

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ctaButton: {
      /**
       * Insert a CTA button
       */
      insertButton: (attributes: { url: string; text: string }) => ReturnType;
    };
  }
}

export const TiptapButton = Node.create<ButtonOptions>({
  name: "ctaButton",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
      text: {
        default: "Click Here",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="cta-button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "cta-button",
        href: HTMLAttributes.url,
        target: "_blank",
        class: "rhinon-cta-button",
        style: "display: inline-block; padding: 12px 24px; background-color: #172554; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: sans-serif; margin: 16px 0;",
      }),
      HTMLAttributes.text,
    ];
  },

  addCommands() {
    return {
      insertButton:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
