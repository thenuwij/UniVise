// Conversation.jsx
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput
} from "flowbite-react";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

export default function Conversation({ show, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  const handleSave = () => {
    const conversationId = uuid();
    onSave({title , conversationId});
    setTitle("");
    onClose();
    navigate(`/chat/${conversationId}`);
  };

  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <ModalHeader>
        <p className="text-lg font-medium p-4">Topic to discuss</p>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" value="Title" />
            <TextInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How does ATAR Scaling work?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button color="gray" onClick={onClose} pill>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()} pill className="
              w-24 bg-gradient-to-br from-purple-600 to-blue-500
              text-white hover:bg-gradient-to-bl
            ">
              Create
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
