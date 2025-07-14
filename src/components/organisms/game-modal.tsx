'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { useModalStore } from '@/store/modal-store';
import { Info } from 'lucide-react';
import { Modal } from './modal';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game';

import { KeysClause, ToriiQueryBuilder } from "@dojoengine/sdk";

import { ModelsMapping } from "../../lib/dojo/typescript/models.gen";
import { useSystemCalls } from "../../lib/dojo/useSystemCalls";
import { useAccount } from "@starknet-react/core";
import {
  useDojoSDK,
  useEntityId,
  useEntityQuery,
  useModel,
} from "@dojoengine/sdk/react";
import { addAddressPadding, CairoCustomEnum } from "starknet";

export function GameModal() {
  const { isOpen, closeModal, modalType } = useModalStore();
  const [genre, setGenre] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const isModalOpen = isOpen && modalType === 'game';

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!genre) errors.genre = 'Genre is required';
    if (!difficulty) errors.difficulty = 'Difficulty is required';
    if (!duration) errors.duration = 'Duration is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const { account, address, status } = useAccount();
  const { useDojoStore, client } = useDojoSDK();
  const entities = useDojoStore((state) => state.entities);
  const { createRound } = useSystemCalls();


  const GENRE_ENUM_MAP: Record<string, string> = {
    pop: "Pop",
    rock: "Rock",
    hiphop: "HipHop",
    rnb: "Rnb",
  };


    const handleStartGame = async () => {
      if (!validateForm()) return;
    
      try {
        const cairoVariant = GENRE_ENUM_MAP[genre];
        const genreEnum = new CairoCustomEnum({ [cairoVariant]: {} });

        await createRound(genreEnum);
    
        // Update game store (local state)
        startGame({
          genre,
          difficulty,
          duration,
          odds: 3,
          wagerAmount: 0,
          isMultiplayer: false,
        });
    
        closeModal();
        router.push("/quick-game");
      } catch (err) {
        console.error("Failed to create round:", err);
        // Optionally show UI error feedback here
      }
    };
    

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="Quick Game"
      description="Quisque ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum."
      primaryActionLabel="Start Game"
    >
      <div className="grid gap-6">
        <div className="grid gap-2">
          <label htmlFor="genre" className="text-sm font-medium">
            Genre
          </label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="hiphop">Hip Hop</SelectItem>
              <SelectItem value="rnb">R&B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="difficulty" className="text-sm font-medium">
            Difficulty Level
          </label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="duration" className="text-sm font-medium">
            Duration
          </label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5min">5 minutes</SelectItem>
              <SelectItem value="10min">10 minutes</SelectItem>
              <SelectItem value="15min">15 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg flex gap-3">
          <div className="bg-purple-100 rounded-full p-1 h-6 w-6 flex items-center justify-center flex-shrink-0">
            <Info className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-sm">
            <h4 className="font-medium text-purple-700 mb-1">INSTRUCTION</h4>
            <p className="text-gray-700">
              A card displaying a lyric from a song will appear along with a list of possible answers. Your goal is to
              select the correct answer as quickly as possible.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
