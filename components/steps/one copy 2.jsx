"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { FaTrash, FaUserPlus } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/multiselect";

export const StepOne = ({ onNext, formData, setFormData }) => {
  const [students, setStudents] = useState({
    genre: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    typePratique: "Soutien scolaire",
    instruments: [],
    niveau: "",
    adresse: "",
    ville: "",
    codePostal: "",
    x: "",
    y: "",
    telephone: "",
    disponibilites: [],
    message: "",
  });

  console.log(students);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [studentToRemoveIndex, setStudentToRemoveIndex] = useState(null);
  const [errors, setErrors] = useState([]);
  const [disponibiliteError, setDisponibiliteError] = useState("");
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(null);

  useEffect(() => {
    if (students.length > 0) {
      setExpandedAccordionIndex(students.length - 1);
    }
  }, [students]);

  const [selectedInstruments, setSelectedInstruments] = useState([]);

  const handleInstrumentChange = (value) => {
    setSelectedInstruments(value);
    setStudents((prevStudents) => ({
      ...prevStudents,
      instruments: value,
    }));
  };

  const addStudent = (e) => {
    e.preventDefault();
    setFormData((prevFormData) => ({
      ...prevFormData,
      students: [...prevFormData.students, students],
    }));
    setErrors((prevErrors) => [...prevErrors, []]);
  };

  const removeStudent = (index) => {
    setStudentToRemoveIndex(index);
    setShowConfirmationModal(true);
  };

  const confirmRemoveStudent = () => {
    setStudents((prevStudents) =>
      prevStudents.filter((_, idx) => idx !== studentToRemoveIndex)
    );
    setErrors((prevErrors) =>
      prevErrors.filter((_, idx) => idx !== studentToRemoveIndex)
    );
    setShowConfirmationModal(false);
  };

  const cancelRemoveStudent = () => {
    setShowConfirmationModal(false);
  };

  const loadAddressOptions = async (inputValue) => {
    if (inputValue.length < 1) return [];
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${inputValue}&limit=5`
      );
      const json = await response.json();
      return json.features.map((feature) => ({
        label: feature.properties.label,
        value: feature.properties.label,
        details: feature.properties,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des données : ", error);
      return [];
    }
  };

  const handleAddressChange = (index, selectedOption) => {
    setStudents({
      ...students,
      adresse: selectedOption.details.name,
      ville: selectedOption.details.city,
      codePostal: selectedOption.details.citycode,
      x: selectedOption.details.x,
      y: selectedOption.details.y,
    });
  };

  const addDisponibilite = (index, jour, debut, fin) => {
    if (!jour) {
      setDisponibiliteError("Veuillez sélectionner un jour.");
      return;
    }
    if (debut >= fin) {
      setDisponibiliteError(
        "L'heure de fin doit être postérieure à l'heure de début."
      );
      return;
    }
    const debutHeure = parseInt(debut.split(":")[0]);
    if (debutHeure < 8 || debutHeure > 22) {
      setDisponibiliteError(
        "L'heure de début doit être comprise entre 8h et 22h."
      );
      return;
    }
    const finHeure = parseInt(fin.split(":")[0]);
    if (finHeure > 22) {
      setDisponibiliteError(
        "L'heure de fin ne doit pas être postérieure à 22h."
      );
      return;
    }
    const debutMinutes = parseInt(debut.split(":")[1]);
    const finMinutes = parseInt(fin.split(":")[1]);
    const duree = finHeure * 60 + finMinutes - (debutHeure * 60 + debutMinutes);
    if (duree < 60) {
      setDisponibiliteError(
        "La durée de disponibilité doit être d'au moins 1 heure."
      );
      return;
    }

    const conflits = students.disponibilites.some((dispo) => {
      if (dispo.jour !== jour) return false;
      const dispoDebut =
        parseInt(dispo.debut.split(":")[0]) * 60 +
        parseInt(dispo.debut.split(":")[1]);
      const dispoFin =
        parseInt(dispo.fin.split(":")[0]) * 60 +
        parseInt(dispo.fin.split(":")[1]);
      const newDebut =
        parseInt(debut.split(":")[0]) * 60 + parseInt(debut.split(":")[1]);
      const newFin =
        parseInt(fin.split(":")[0]) * 60 + parseInt(fin.split(":")[1]);
      return newDebut < dispoFin && newFin > dispoDebut;
    });

    if (conflits) {
      setDisponibiliteError(
        "Cette disponibilité se chevauche avec une autre disponibilité existante."
      );
      return;
    }

    const existingDisponibilite = students.disponibilites.find(
      (dispo) =>
        dispo.jour === jour && dispo.debut === debut && dispo.fin === fin
    );

    if (existingDisponibilite) {
      setDisponibiliteError("Cette disponibilité existe déjà.");
      return;
    }

    const nouvelleDisponibilite = { jour, debut, fin };
    setStudents((prevStudents) => ({
      ...prevStudents,
      disponibilites: [...prevStudents.disponibilites, nouvelleDisponibilite],
    }));

    setDisponibiliteError("");
  };

  const removeDisponibilite = (index, dispoIndex) => {
    setStudents((prevStudents) => {
      const updatedStudents = { ...prevStudents };
      updatedStudents.disponibilites = updatedStudents.disponibilites.filter(
        (_, idx) => idx !== dispoIndex
      );
      return updatedStudents;
    });
  };

  const [tempDisponibilite, setTempDisponibilite] = useState({
    jour: "",
    debut: "",
    fin: "",
  });

  const handleDisponibiliteChange = (e) => {
    const { name, value } = e.target;
    setTempDisponibilite((prev) => ({ ...prev, [name]: value }));
  };

  const instrumentsOptions = [
    { value: "piano", label: "Piano" },
    { value: "guitare", label: "Guitare" },
    { value: "violon", label: "Violon" },
    { value: "flûte traversière", label: "Flûte traversière" },
    { value: "batterie", label: "Batterie" },
    { value: "saxophone", label: "Saxophone" },
    { value: "clarinette", label: "Clarinette" },
    { value: "trompette", label: "Trompette" },
    { value: "violoncelle", label: "Violoncelle" },
    { value: "accordéon", label: "Accordéon" },
    { value: "basse", label: "Basse" },
    { value: "harmonica", label: "Harmonica" },
    { value: "ukulélé", label: "Ukulélé" },
    { value: "guitare électrique", label: "Guitare électrique" },
    { value: "trombone", label: "Trombone" },
    { value: "chant", label: "Chant" },
    { value: "m.a.o", label: "M.A.O" },
    { value: "percussions", label: "Percussions" },
    { value: "éveil musical", label: "Éveil musical" },
    { value: "flûte à bec", label: "Flûte à bec" },
  ];

  const joursOptions = [
    { value: "Lundi", label: "Lundi" },
    { value: "Mardi", label: "Mardi" },
    { value: "Mercredi", label: "Mercredi" },
    { value: "Jeudi", label: "Jeudi" },
    { value: "Vendredi", label: "Vendredi" },
    { value: "Samedi", label: "Samedi" },
  ];

  return (
    <motion.form
      onSubmit={onNext}
      className="flex flex-col space-y-4"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 bg-white rounded-lg md:w-4/5 lg:w-1/2 xl:w-1/2 w-4/5 mx-auto">
        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
          Projet élève
        </h2>
        <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
          texte
        </p>
        <div className="shadow-md rounded-lg bg-[#752466] mx-auto">
          {formData.students.length > 0
            ? "on a un eleve"
            : [students].map((student, index) => (
                <Accordion
                  type="single"
                  collapsible
                  value={
                    expandedAccordionIndex !== null
                      ? String(expandedAccordionIndex)
                      : undefined
                  }
                  onValueChange={(value) =>
                    setExpandedAccordionIndex(
                      value !== undefined ? parseInt(value) : null
                    )
                  }
                >
                  <AccordionItem key={index} value={String(index)}>
                    <AccordionTrigger className="px-[1rem]">
                      <div className="flex items-center">
                        <span className="mr-2 text-1xl font-semibold text-white">
                          {student.prenom
                            ? `Élève : ${student.prenom}`
                            : "Informations de l'élève"}
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FaTrash
                              onClick={() => removeStudent(index)}
                              className="cursor-pointer text-white"
                            />
                          </PopoverTrigger>
                          <PopoverContent>
                            {showConfirmationModal && (
                              <div>
                                <p>
                                  Êtes-vous sûr de vouloir supprimer cet élève ?
                                </p>
                                <div className="grid gap-6 m-6 md:grid-cols-2">
                                  <Button
                                    onClick={confirmRemoveStudent}
                                    className="shadow-md rounded-lg bg-[#752466] mx-auto transition-transform transform-gpu hover:bg-[#752466] hover:scale-105"
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    onClick={cancelRemoveStudent}
                                    className="shadow-md rounded-lg bg-[#752466] mx-auto transition-transform transform-gpu hover:bg-[#752466] hover:scale-105"
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-white p-4">
                        <h3 className="mb-4 text-2xl font-semibold">
                          Profil de l'élève
                        </h3>
                        <Separator className=" mb-8 border-2 border-[#F25C05] bg-[#F25C05]" />

                        <div>
                          <div>
                            <form>
                              <div className="grid gap-6 mb-6 md:grid-cols-4">
                                <div>
                                  <label
                                    htmlFor="genre"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Civilité
                                  </label>
                                  <select
                                    id="genre"
                                    value={student.genre}
                                    onChange={(e) =>
                                      setStudents({
                                        ...students,
                                        genre: e.target.value,
                                      })
                                    }
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                  >
                                    <option selected>Choisir</option>
                                    <option value="Madame">Madame</option>
                                    <option value="Monsieur">Monsieur</option>
                                    <option value="Non précisé">
                                      Non précisé
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <label
                                    htmlFor="nom"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Nom de famille
                                  </label>
                                  <input
                                    type="text"
                                    id="nom"
                                    name="nom"
                                    value={student.nom}
                                    onChange={(e) =>
                                      setStudents({
                                        ...students,
                                        nom: e.target.value,
                                      })
                                    }
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Nom de famille"
                                    required
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor="prenom"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Prénom(s)
                                  </label>
                                  <input
                                    type="text"
                                    id="prenom"
                                    name="prenom"
                                    value={student.prenom}
                                    onChange={(e) => {
                                      setStudents({
                                        ...students,
                                        prenom: e.target.value,
                                      });
                                    }}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Prénom"
                                    required
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor="dateNaissance"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Date de naissance
                                  </label>
                                  <input
                                    type="date"
                                    id="dateNaissance"
                                    name="dateNaissance"
                                    value={student.dateNaissance}
                                    onChange={(e) =>
                                      setStudents({
                                        ...students,
                                        dateNaissance: e.target.value,
                                      })
                                    }
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Date de naissance"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="grid gap-6 mb-6 md:grid-cols-3">
                                <div>
                                  <label
                                    htmlFor="typePratique"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Type de l’activité
                                  </label>
                                  <select
                                    id="typePratique"
                                    name="typePratique"
                                    value={student.typePratique}
                                    onChange={(e) =>
                                      setStudents({
                                        ...students,
                                        typePratique: e.target.value,
                                      })
                                    }
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                  >
                                    <option selected>Soutien scolaire</option>
                                    <option value="Loisir">Loisir</option>
                                  </select>
                                </div>
                                <div>
                                  <label
                                    htmlFor="instruments"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Instrument(s):
                                  </label>
                                  <MultiSelector
                                    values={selectedInstruments}
                                    onValuesChange={handleInstrumentChange}
                                    loop
                                    className="max-w-xs"
                                  >
                                    <MultiSelectorTrigger>
                                      <MultiSelectorInput
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Sélectionner"
                                      />
                                    </MultiSelectorTrigger>
                                    <MultiSelectorContent>
                                      <MultiSelectorList>
                                        {instrumentsOptions.map(
                                          (instrument) => (
                                            <MultiSelectorItem
                                              key={instrument.value}
                                              value={instrument.value}
                                            >
                                              {instrument.label}
                                            </MultiSelectorItem>
                                          )
                                        )}
                                      </MultiSelectorList>
                                    </MultiSelectorContent>
                                  </MultiSelector>
                                </div>
                                <div>
                                  <label
                                    htmlFor="niveau"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Niveau
                                  </label>
                                  <select
                                    id="niveau"
                                    name="niveau"
                                    value={student.niveau}
                                    onChange={(e) =>
                                      setStudents({
                                        ...students,
                                        niveau: e.target.value,
                                      })
                                    }
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                  >
                                    <option selected>Sélectionner</option>
                                    <option value="debutant">Débutant</option>
                                    <option value="intermediaire">
                                      Intermédiaire
                                    </option>
                                    <option value="intermediaire+">
                                      Intermédiaire +
                                    </option>
                                    <option value="avance">Avancé</option>
                                  </select>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>

                        <h3 className="mb-4 text-2xl font-semibold">
                          Adresse et contact de l'élève
                        </h3>
                        <Separator className=" mb-8 border-2 border-[#F25C05] bg-[#F25C05]" />

                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              Adresse:
                            </label>
                            <AsyncSelect
                              cacheOptions
                              loadOptions={loadAddressOptions}
                              defaultOptions
                              onChange={(selectedOption) =>
                                handleAddressChange(index, selectedOption)
                              }
                              placeholder="Entrez une adresse..."
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              Code postal :
                            </label>
                            <input
                              type="codePostal"
                              id="codePostal"
                              name="codePostal"
                              value={student.codePostal}
                              onChange={(e) =>
                                setStudents({
                                  ...students,
                                  codePostal: e.target.value,
                                })
                              }
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholder="Code Postal"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                          <div>
                            <label
                              htmlFor="ville"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Ville
                            </label>
                            <input
                              type="text"
                              id="ville"
                              name="ville"
                              value={student.ville}
                              onChange={(e) =>
                                setStudents({
                                  ...students,
                                  ville: e.target.value,
                                })
                              }
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholder="Ville"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="telephone"
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Téléphone
                            </label>
                            <input
                              type="text"
                              id="telephone"
                              name="telephone"
                              value={student.telephone}
                              onChange={(e) =>
                                setStudents({
                                  ...students,
                                  telephone: e.target.value,
                                })
                              }
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              placeholder="Téléphone"
                              required
                            />
                          </div>
                        </div>

                        <h3 className="mb-4 text-2xl font-semibold">
                          Disponibilités de l’élève
                        </h3>
                        <Separator className=" mb-8 border-2 border-[#F25C05] bg-[#F25C05]" />

                        <p className="mb-8">
                          Information indicative qui nous permet d’affiner notre
                          sélection de professeurs. Pourra être ajusté après
                          l'inscription.
                        </p>
                        <div className="grid gap-6 mb-6 md:grid-cols-4">
                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              htmlFor="jour"
                            >
                              Jour:
                            </label>
                            <select
                              id="jour"
                              value={tempDisponibilite.jour}
                              onChange={(e) =>
                                setTempDisponibilite((prev) => ({
                                  ...prev,
                                  jour: e.target.value,
                                }))
                              }
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            >
                              <option value="" disabled>
                                Sélectionner
                              </option>
                              {joursOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              htmlFor="debut"
                            >
                              Heure de début:
                            </label>
                            <input
                              type="time"
                              id="debut"
                              name="debut"
                              value={tempDisponibilite.debut}
                              onChange={handleDisponibiliteChange}
                              min="08:00"
                              max="22:00"
                              step="900" // 15 minutes in seconds
                              placeholder="Heure de début"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label
                              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              htmlFor="fin"
                            >
                              Heure de fin:
                            </label>
                            <input
                              type="time"
                              id="fin"
                              name="fin"
                              value={tempDisponibilite.fin}
                              onChange={handleDisponibiliteChange}
                              placeholder="Heure de fin"
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center">
                            <div
                              onClick={() =>
                                addDisponibilite(
                                  index,
                                  tempDisponibilite.jour,
                                  tempDisponibilite.debut,
                                  tempDisponibilite.fin
                                )
                              }
                              type="submit"
                              className="shadow-md rounded-lg bg-[#752466]  text-white p-3 mx-auto transition-transform transform-gpu hover:bg-[#752466] hover:scale-105"
                            >
                              Ajouter
                            </div>
                          </div>
                        </div>

                        {disponibiliteError && (
                          <div className="grid gap-6 mb-6 md:grid-cols-1">
                            {disponibiliteError}
                          </div>
                        )}
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                          {student.disponibilites.map((dispo, dispoIndex) => (
                            <span
                              key={dispoIndex}
                              className="disponibilite-item bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 inline-block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              style={{
                                width: "100%",
                                display: "inline-flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {dispo.jour} : de {dispo.debut} à {dispo.fin}
                              <FaTrash
                                onClick={() =>
                                  removeDisponibilite(index, dispoIndex)
                                }
                                style={{
                                  cursor: "pointer",
                                  color: "#F25C05",
                                  marginLeft: "5px",
                                }}
                              />
                            </span>
                          ))}
                        </div>

                        <h3 className="mb-4 text-2xl font-semibold">
                          Précisions/Questions
                        </h3>
                        <Separator className=" mb-8 border-2 border-[#F25C05] bg-[#F25C05]" />

                        <label
                          htmlFor="questions"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          Votre message
                        </label>
                        <textarea
                          onChange={(e) =>
                            setStudents({
                              ...students,
                              message: e.target.value,
                            })
                          }
                          id="questions"
                          rows="4"
                          className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          placeholder="Style de musique, achat ou location d'instrument, précisions, conseils, questions : nous sommes à votre écoute."
                        ></textarea>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
        </div>
        <div className="grid gap-6 m-6 md:grid-cols-1">
          <div className="flex justify-between">
            <Button
              onClick={addStudent}
              className="shadow-md rounded-lg bg-white text-[#752466] border-2 border-[#752466] transition-transform transform-gpu hover:bg-white hover:scale-105"
            >
              <FaUserPlus className="mr-2" />
              Ajouter Élève
            </Button>
            <Button
              type="submit"
              className="shadow-md rounded-lg bg-[#752466] transition-transform transform-gpu hover:bg-[#752466] hover:scale-105"
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};
