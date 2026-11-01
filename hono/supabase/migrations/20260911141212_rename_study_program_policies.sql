begin;

alter policy "Professor study program mappings are viewable by everyone" on public.professor_studies rename to "Professor study mappings are viewable by everyone";
alter policy "moderators can delete professor study programs" on public.professor_studies rename to "moderators can delete professor studies";
alter policy "moderators can insert professor study programs" on public.professor_studies rename to "moderators can insert professor studies";
alter policy "Profile study programs are viewable by everyone" on public.profile_studies rename to "Profile studies are viewable by everyone";
alter policy "Users can delete their own study programs" on public.profile_studies rename to "Users can delete their own studies";
alter policy "Users can insert their own study programs" on public.profile_studies rename to "Users can insert their own studies";
alter policy "study_programs are publicly readable" on public.studies rename to "studies are publicly readable";

commit;;
