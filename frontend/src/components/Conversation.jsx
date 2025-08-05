// Conversation.jsx
import React from 'react'
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput
} from "flowbite-react";

export default function Conversation({ show, onClose, onSave }) {
  const [title, setTitle] = React.useState("");

  const handleSave = () => {
    onSave(title);
    setTitle("");
    onClose();
  };

  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <ModalHeader>
        <p className="text-lg font-medium p-4">What did you want to ask?</p>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" value="Title" />
            <TextInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My recommendations"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button color="gray" onClick={onClose} pill>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()} pill>
              Create
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
