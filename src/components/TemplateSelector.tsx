import React from "react";

type TemplateSelectorProps = {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
};
/**
 * Component that allows users to select a template for the document
 * @param {TemplateSelectorProps} props - The props for the template selector
 * @param {string} props.selectedTemplate - The selected template
 * @param {Function} props.onSelectTemplate - The function to handle the template selection
 * @returns {JSX.Element}
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  //list of templates
  const templates = ["Document", "Letter"];

  return (
    <div className="mb-4 ">
      <label className="text-gray-700">Select Template: &nbsp;</label>
      <select
        className="px-4 py-2 rounded "
        value={selectedTemplate}
        onChange={(e) => onSelectTemplate(e.target.value)}
      >
        {templates.map((template) => (
          <option key={template} value={template}>
            {template}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TemplateSelector;
